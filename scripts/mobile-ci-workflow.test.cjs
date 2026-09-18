const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

test("pull requests and main run the complete mobile source gate", () => {
	const workflow = readFileSync(resolve(__dirname, "../.github/workflows/mobile-ci.yml"), "utf8");

	assert.match(workflow, /pull_request:/);
	assert.match(workflow, /push:\s*\n\s*branches: \[main\]/);
	assert.match(workflow, /node-version: ['"]22['"]/);
	assert.match(workflow, /npm ci/);
	assert.match(workflow, /npm run verify:ci/);
	assert.match(workflow, /fetch-depth:\s*0/);
	assert.match(workflow, /zricethezav\/gitleaks:v8\.28\.0@sha256:[0-9a-f]{64}/);
	assert.match(workflow, /--network none --read-only/);
	assert.match(workflow, /\/repo:ro/);
	assert.match(workflow, /--log-opts=--all/);
	assert.match(workflow, /--redact=100/);
	assert.doesNotMatch(workflow, /uses:\s+[^\s]+@v\d+/);
	for (const reference of workflow.matchAll(/uses:\s+([^\s#]+)/g)) {
		assert.match(reference[1], /@[0-9a-f]{40}$/);
	}
});
