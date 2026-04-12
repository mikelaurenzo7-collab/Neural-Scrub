import type { AIFeatures, PatternMatch } from "../../types/index.js";
import { BasePattern } from "./base.js";

/**
 * Devin (Cognition) detection patterns.
 *
 * Key behavioral fingerprint:
 * - Full project scaffolding from scratch
 * - CI/CD pipeline files (.github/workflows/*.yml)
 * - Dockerfiles, docker-compose.yml
 * - Infrastructure-as-code files
 * - Multi-service architecture
 * - Health check endpoints
 * - LABEL directives in Dockerfiles
 * - Creates many files autonomously from high-level instructions
 * - Error handling middleware, structured project layout
 */

export class DevinInfrastructureFilePattern extends BasePattern {
  id = "devin-infrastructure-file";
  name = "Infrastructure/DevOps file creation";
  description = "Devin creates CI/CD, Docker, and infrastructure files autonomously";

  match(features: AIFeatures): PatternMatch | null {
    if (features.isNewFile && features.isInfrastructureFile) {
      return this.createMatch(
        "infrastructure-file",
        0.9,
        1.0,
        `New infrastructure file ${features.file.newPath} — Devin's autonomous DevOps scaffolding`,
      );
    }
    return null;
  }
}

export class DevinCICDPipelinePattern extends BasePattern {
  id = "devin-cicd-pipeline";
  name = "CI/CD pipeline creation";
  description = "Devin creates GitHub Actions workflows and CI configs";

  match(features: AIFeatures): PatternMatch | null {
    const path = features.file.newPath.toLowerCase();
    if (
      features.isNewFile &&
      (path.includes(".github/workflows/") ||
        path.includes(".gitlab-ci") ||
        path.includes("jenkinsfile"))
    ) {
      return this.createMatch(
        "cicd-pipeline",
        0.9,
        0.95,
        `CI/CD pipeline ${features.file.newPath} — Devin creates full deployment pipelines`,
      );
    }
    return null;
  }
}

export class DevinDockerfilePattern extends BasePattern {
  id = "devin-dockerfile";
  name = "Dockerfile creation";
  description = "Devin creates Dockerfiles with multi-stage builds and health checks";

  match(features: AIFeatures): PatternMatch | null {
    const path = features.file.newPath.toLowerCase();
    if (
      features.isNewFile &&
      (path.endsWith("dockerfile") || path.includes("docker-compose"))
    ) {
      return this.createMatch(
        "dockerfile-creation",
        0.85,
        0.9,
        `Docker config ${features.file.newPath} — Devin's containerization pattern`,
      );
    }
    return null;
  }
}

export class DevinLargeScaffoldPattern extends BasePattern {
  id = "devin-large-scaffold";
  name = "Large autonomous file creation";
  description = "Devin creates large new files as part of full project scaffolding";

  match(features: AIFeatures): PatternMatch | null {
    if (
      features.isNewFile &&
      features.file.addedLines > 40 &&
      (features.isInfrastructureFile || features.totalFilesInDiff >= 6)
    ) {
      return this.createMatch(
        "large-scaffold",
        0.6,
        0.65,
        `New file with ${features.file.addedLines} lines — large autonomous creation consistent with Devin`,
      );
    }
    return null;
  }
}

export class DevinErrorMiddlewarePattern extends BasePattern {
  id = "devin-error-middleware";
  name = "Error handling middleware";
  description = "Devin creates structured error handling middleware in web projects";

  match(features: AIFeatures): PatternMatch | null {
    const path = features.file.newPath.toLowerCase();
    if (
      features.isNewFile &&
      (path.includes("middleware") || path.includes("error")) &&
      features.ast.errorClassCount >= 1
    ) {
      return this.createMatch(
        "error-middleware",
        0.7,
        0.75,
        `Error middleware ${features.file.newPath} with ${features.ast.errorClassCount} error classes — Devin's structured error handling`,
      );
    }
    return null;
  }
}

export class DevinHealthCheckPattern extends BasePattern {
  id = "devin-health-check";
  name = "Health check endpoint/route";
  description = "Devin adds health check routes in web service scaffolds";

  match(features: AIFeatures): PatternMatch | null {
    const code = features.file.hunks
      .flatMap((h) => h.lines)
      .filter((l) => l.type === "add")
      .map((l) => l.content)
      .join("\n");

    if (
      features.isNewFile &&
      /health|healthcheck|health-check|readiness|liveness/i.test(code)
    ) {
      return this.createMatch(
        "health-check",
        0.65,
        0.7,
        `Health check pattern in ${features.file.newPath} — Devin adds observability endpoints`,
      );
    }
    return null;
  }
}

export class DevinMultiServicePattern extends BasePattern {
  id = "devin-multi-service";
  name = "Multi-service architecture signals";
  description = "Devin builds multi-service setups with Docker Compose and service orchestration";

  match(features: AIFeatures): PatternMatch | null {
    const code = features.file.hunks
      .flatMap((h) => h.lines)
      .filter((l) => l.type === "add")
      .map((l) => l.content)
      .join("\n");

    if (
      features.isNewFile &&
      features.isInfrastructureFile &&
      /services:|depends_on:|volumes:|networks:/i.test(code)
    ) {
      return this.createMatch(
        "multi-service",
        0.75,
        0.8,
        `Multi-service compose config in ${features.file.newPath} — Devin's infrastructure orchestration`,
      );
    }
    return null;
  }
}

export const devinPatterns = [
  new DevinInfrastructureFilePattern(),
  new DevinCICDPipelinePattern(),
  new DevinDockerfilePattern(),
  new DevinLargeScaffoldPattern(),
  new DevinErrorMiddlewarePattern(),
  new DevinHealthCheckPattern(),
  new DevinMultiServicePattern(),
];
