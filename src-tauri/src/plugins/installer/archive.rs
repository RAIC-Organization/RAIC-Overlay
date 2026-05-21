// Zip extraction for plugin bundles.
//
// Security: every entry path is validated against the target directory
// (zip-slip guard, classic CVE-2018-1002200 family). Symlinks are ignored
// (we don't honor them on Windows anyway).

use std::fs;
use std::io;
use std::path::{Component, Path, PathBuf};

use zip::ZipArchive;

/// Extract a `raic-plugin.zip` into `dest_dir`. The destination must already
/// exist and be empty (callers create a tempdir for this).
///
/// Each entry's relative path is validated to ensure it stays within
/// `dest_dir` after normalisation. Any entry with absolute or parent-traversal
/// components is rejected, the partial extraction is wiped, and an error is
/// returned naming the offending entry.
pub fn extract_into(zip_path: &Path, dest_dir: &Path) -> Result<(), String> {
    let file = fs::File::open(zip_path).map_err(|e| format!("open {}: {e}", zip_path.display()))?;
    let mut archive =
        ZipArchive::new(file).map_err(|e| format!("read zip {}: {e}", zip_path.display()))?;

    for i in 0..archive.len() {
        let mut entry = archive
            .by_index(i)
            .map_err(|e| format!("read zip entry {i}: {e}"))?;

        // Use `enclosed_name` which canonicalises and rejects parent
        // traversal at the zip-crate level.
        let raw_name = entry.name().to_string();
        let rel = match entry.enclosed_name() {
            Some(p) => p,
            None => {
                wipe(dest_dir);
                return Err(format!(
                    "zip-slip blocked: entry {raw_name:?} has path-traversal components"
                ));
            }
        };

        // Reject absolute paths and any leftover `..` (belt-and-braces).
        if rel.is_absolute()
            || rel.components().any(|c| matches!(c, Component::ParentDir))
        {
            wipe(dest_dir);
            return Err(format!(
                "zip-slip blocked: entry {raw_name:?} resolves outside dest"
            ));
        }

        let out_path: PathBuf = dest_dir.join(&rel);

        // Final defence: canonicalise the parent of the target and check it
        // stays under dest. We canonicalise the parent since the file itself
        // may not exist yet.
        if let Some(parent) = out_path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("create dir {}: {e}", parent.display()))?;
            let dest_canon = dest_dir.canonicalize().map_err(|e| {
                format!("canonicalise dest {}: {e}", dest_dir.display())
            })?;
            let parent_canon = parent
                .canonicalize()
                .map_err(|e| format!("canonicalise {}: {e}", parent.display()))?;
            if !parent_canon.starts_with(&dest_canon) {
                wipe(dest_dir);
                return Err(format!(
                    "zip-slip blocked: entry {raw_name:?} escapes dest"
                ));
            }
        }

        if entry.is_dir() {
            fs::create_dir_all(&out_path)
                .map_err(|e| format!("create dir {}: {e}", out_path.display()))?;
        } else {
            let mut out = fs::File::create(&out_path)
                .map_err(|e| format!("create {}: {e}", out_path.display()))?;
            io::copy(&mut entry, &mut out)
                .map_err(|e| format!("write {}: {e}", out_path.display()))?;
        }
    }

    Ok(())
}

fn wipe(dir: &Path) {
    let _ = fs::remove_dir_all(dir);
    let _ = fs::create_dir_all(dir);
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use zip::write::SimpleFileOptions;
    use zip::ZipWriter;

    fn make_zip(entries: &[(&str, &[u8])]) -> Vec<u8> {
        let mut buf: Vec<u8> = Vec::new();
        {
            let cursor = std::io::Cursor::new(&mut buf);
            let mut zw = ZipWriter::new(cursor);
            let opts = SimpleFileOptions::default()
                .compression_method(zip::CompressionMethod::Stored);
            for (name, contents) in entries {
                zw.start_file(*name, opts).unwrap();
                zw.write_all(contents).unwrap();
            }
            zw.finish().unwrap();
        }
        buf
    }

    fn write_temp_zip(bytes: &[u8]) -> tempfile::TempPath {
        let mut tf = tempfile::NamedTempFile::new().unwrap();
        tf.write_all(bytes).unwrap();
        tf.into_temp_path()
    }

    #[test]
    fn extracts_simple_zip() {
        let zip_bytes = make_zip(&[
            ("raic-plugin.json", b"{}"),
            ("ui/index.html", b"<html></html>"),
        ]);
        let zpath = write_temp_zip(&zip_bytes);
        let dest = tempfile::tempdir().unwrap();
        extract_into(&zpath, dest.path()).expect("extract should succeed");
        assert!(dest.path().join("raic-plugin.json").exists());
        assert!(dest.path().join("ui/index.html").exists());
    }

    #[test]
    fn rejects_parent_traversal() {
        let zip_bytes = make_zip(&[("../escape.txt", b"x")]);
        let zpath = write_temp_zip(&zip_bytes);
        let dest = tempfile::tempdir().unwrap();
        let err = extract_into(&zpath, dest.path()).expect_err("should reject zip-slip");
        assert!(err.contains("zip-slip"));
    }
}
