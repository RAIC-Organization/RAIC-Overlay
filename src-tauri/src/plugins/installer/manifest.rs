// raic-plugin.json JSON Schema validation.
//
// The authoritative schema lives in
// specs/060-plugin-system/contracts/manifest.schema.json and is also
// published at docs/plugins/manifest.schema.json for plugin authors.
// We embed it into the binary at compile time so validation needs no
// external file at runtime.

use std::sync::OnceLock;

use jsonschema::Validator;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::plugins::types::{JsonRpcError, RpcErrorCode};

const MANIFEST_SCHEMA: &str =
    include_str!("../../../../specs/060-plugin-system/contracts/manifest.schema.json");

/// Lazy-compiled JSON Schema. Compilation is expensive (~ms) and the schema
/// never changes at runtime, so we do it once on first validation.
fn schema() -> &'static Validator {
    static SCHEMA: OnceLock<Validator> = OnceLock::new();
    SCHEMA.get_or_init(|| {
        let schema_json: Value =
            serde_json::from_str(MANIFEST_SCHEMA).expect("embedded manifest schema is invalid JSON");
        jsonschema::validator_for(&schema_json)
            .expect("embedded manifest schema failed to compile")
    })
}

/// Strongly-typed manifest mirror of the schema. Mirrors
/// `contracts/manifest.schema.json` + data-model.md §E-4.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Manifest {
    pub manifest_version: u32,
    pub id: String,
    pub name: String,
    pub version: String,
    pub author: String,
    pub description: String,
    pub source_repo_url: String,
    pub min_host_version: String,
    pub protocol_version: u32,
    pub entry: EntryPoint,
    #[serde(default)]
    pub permissions: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub sidecar: Option<SidecarDecl>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub icon: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub license: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub homepage: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EntryPoint {
    pub ui: String,
    #[serde(default = "default_width", skip_serializing_if = "Option::is_none")]
    pub default_width: Option<u32>,
    #[serde(default = "default_height", skip_serializing_if = "Option::is_none")]
    pub default_height: Option<u32>,
}

fn default_width() -> Option<u32> {
    Some(480)
}
fn default_height() -> Option<u32> {
    Some(320)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SidecarDecl {
    pub platforms: std::collections::HashMap<String, SidecarPlatformBinary>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SidecarPlatformBinary {
    pub bin: String,
    #[serde(default)]
    pub args: Vec<String>,
}

/// Manifest validation error with a JSON-pointer-tagged list of issues.
#[derive(Debug, Clone)]
pub struct ManifestError {
    pub message: String,
    pub issues: Vec<ManifestIssue>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ManifestIssue {
    pub path: String,
    pub message: String,
}

impl ManifestError {
    pub fn into_rpc(self) -> JsonRpcError {
        let data = serde_json::json!({ "issues": self.issues });
        JsonRpcError::new(RpcErrorCode::InvalidParams, self.message).with_data(data)
    }
}

/// Validate raw manifest bytes against the embedded JSON Schema and parse
/// them into a strongly-typed `Manifest`. Returns every schema violation
/// (with JSON pointer) when the validation fails.
pub fn validate_and_parse(bytes: &[u8]) -> Result<Manifest, ManifestError> {
    let json: Value = serde_json::from_slice(bytes).map_err(|e| ManifestError {
        message: format!("manifest is not valid JSON: {e}"),
        issues: vec![ManifestIssue {
            path: "$".into(),
            message: e.to_string(),
        }],
    })?;

    let validator = schema();
    let issues: Vec<ManifestIssue> = validator
        .iter_errors(&json)
        .map(|err| ManifestIssue {
            path: err.instance_path.to_string(),
            message: err.to_string(),
        })
        .collect();

    if !issues.is_empty() {
        return Err(ManifestError {
            message: "manifest failed schema validation".into(),
            issues,
        });
    }

    // Protocol version: schema enforces == 1 via "const": 1. Belt and braces:
    // surface a friendly message if any future schema relaxation slips through.
    let manifest: Manifest = serde_json::from_value(json).map_err(|e| ManifestError {
        message: format!("manifest fields do not match expected types: {e}"),
        issues: vec![],
    })?;

    if manifest.protocol_version != 1 {
        return Err(ManifestError {
            message: format!(
                "manifest declares protocol_version {} but this host only supports v1",
                manifest.protocol_version
            ),
            issues: vec![ManifestIssue {
                path: "/protocol_version".into(),
                message: "expected 1".into(),
            }],
        });
    }

    Ok(manifest)
}

/// `https://github.com/<owner>/<repo>` → `(owner, repo)`.
pub fn parse_github_repo(url: &str) -> Option<(String, String)> {
    let parsed = url::Url::parse(url).ok()?;
    if parsed.host_str()? != "github.com" {
        return None;
    }
    let mut segments = parsed.path_segments()?.filter(|s| !s.is_empty());
    let owner = segments.next()?.to_string();
    let repo = segments.next()?.trim_end_matches(".git").to_string();
    if segments.next().is_some() {
        return None; // extra path segments — not a bare repo URL
    }
    if owner.is_empty() || repo.is_empty() {
        return None;
    }
    Some((owner, repo))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn minimal_manifest_json() -> serde_json::Value {
        serde_json::json!({
            "manifest_version": 1,
            "id": "com.alice.demo",
            "name": "Demo",
            "version": "0.1.0",
            "author": "Alice",
            "description": "A demo plugin.",
            "source_repo_url": "https://github.com/alice/demo",
            "min_host_version": "1.0.0",
            "protocol_version": 1,
            "entry": { "ui": "ui/index.html" },
            "permissions": []
        })
    }

    #[test]
    fn accepts_minimal_valid_manifest() {
        let bytes = serde_json::to_vec(&minimal_manifest_json()).unwrap();
        let m = validate_and_parse(&bytes).expect("should accept minimal valid manifest");
        assert_eq!(m.id, "com.alice.demo");
        assert_eq!(m.entry.ui, "ui/index.html");
    }

    #[test]
    fn rejects_bad_id_format() {
        let mut j = minimal_manifest_json();
        j["id"] = serde_json::json!("BAD ID");
        let bytes = serde_json::to_vec(&j).unwrap();
        let err = validate_and_parse(&bytes).expect_err("should reject bad id");
        assert!(err.issues.iter().any(|i| i.path.contains("/id")));
    }

    #[test]
    fn rejects_bad_semver() {
        let mut j = minimal_manifest_json();
        j["version"] = serde_json::json!("not-semver");
        let bytes = serde_json::to_vec(&j).unwrap();
        assert!(validate_and_parse(&bytes).is_err());
    }

    #[test]
    fn rejects_non_github_source_url() {
        let mut j = minimal_manifest_json();
        j["source_repo_url"] = serde_json::json!("https://gitlab.com/alice/demo");
        let bytes = serde_json::to_vec(&j).unwrap();
        assert!(validate_and_parse(&bytes).is_err());
    }

    #[test]
    fn rejects_protocol_version_2() {
        let mut j = minimal_manifest_json();
        j["protocol_version"] = serde_json::json!(2);
        let bytes = serde_json::to_vec(&j).unwrap();
        let err = validate_and_parse(&bytes).expect_err("should reject protocol_version 2 (E3)");
        assert!(err.message.contains("protocol") || err.issues.iter().any(|i| i.path.contains("protocol")));
    }

    #[test]
    fn rejects_unknown_manifest_version() {
        let mut j = minimal_manifest_json();
        j["manifest_version"] = serde_json::json!(99);
        let bytes = serde_json::to_vec(&j).unwrap();
        assert!(validate_and_parse(&bytes).is_err());
    }

    #[test]
    fn rejects_missing_required_field() {
        let mut j = minimal_manifest_json();
        j.as_object_mut().unwrap().remove("name");
        let bytes = serde_json::to_vec(&j).unwrap();
        assert!(validate_and_parse(&bytes).is_err());
    }

    #[test]
    fn rejects_sidecar_without_permission() {
        let mut j = minimal_manifest_json();
        j["sidecar"] = serde_json::json!({
            "platforms": { "windows-x86_64": { "bin": "bin/x.exe" } }
        });
        // permissions array does NOT include "sidecar"
        let bytes = serde_json::to_vec(&j).unwrap();
        assert!(validate_and_parse(&bytes).is_err());
    }

    #[test]
    fn parses_valid_github_url() {
        let (owner, repo) = parse_github_repo("https://github.com/alice/demo").unwrap();
        assert_eq!(owner, "alice");
        assert_eq!(repo, "demo");
    }

    #[test]
    fn parses_github_url_with_dot_git_suffix() {
        let (_, repo) = parse_github_repo("https://github.com/alice/demo.git").unwrap();
        assert_eq!(repo, "demo");
    }

    #[test]
    fn rejects_non_github_url() {
        assert!(parse_github_repo("https://gitlab.com/alice/demo").is_none());
    }

    #[test]
    fn accepts_unknown_permission_name_at_schema_level() {
        // T110 / spec edge case: an unknown permission name must not break the
        // manifest parse. The consent dialog separately classifies it as
        // "unrecognized permission" (verified in the InstallPreview struct
        // logic — see installer/mod.rs::plugin_install_preview).
        let mut j = minimal_manifest_json();
        j["permissions"] = serde_json::json!(["notifications", "future-cool-thing"]);
        let bytes = serde_json::to_vec(&j).unwrap();
        let m = validate_and_parse(&bytes).expect("unknown permission must not break parse (T110)");
        assert!(m.permissions.contains(&"future-cool-thing".to_string()));
        // Permission::parse classifies it as Unknown
        let perm = crate::plugins::types::Permission::parse("future-cool-thing");
        assert!(!perm.is_known());
    }

    #[test]
    fn accepts_partial_platform_sidecar() {
        // T109 / spec edge case: a sidecar declared only for some platforms
        // must validate. The runtime decides whether to actually spawn it on
        // a per-OS basis (data-model.md §E-6 edge case).
        let mut j = minimal_manifest_json();
        j["permissions"] = serde_json::json!(["sidecar"]);
        j["sidecar"] = serde_json::json!({
            "platforms": {
                "linux-x86_64": { "bin": "bin/linux-x86_64/sc" }
                // Note: deliberately NO windows-x86_64 entry
            }
        });
        let bytes = serde_json::to_vec(&j).unwrap();
        let m = validate_and_parse(&bytes).expect("partial-platform sidecar must validate (T109)");
        let sidecar = m.sidecar.expect("sidecar field");
        assert_eq!(sidecar.platforms.len(), 1);
        assert!(sidecar.platforms.contains_key("linux-x86_64"));
        assert!(!sidecar.platforms.contains_key("windows-x86_64"));
    }
}
