import { snapshotTest } from "@cliffy/testing"
import { commentCommand } from "../../../src/commands/issue/comment.ts"
import { MockLinearServer } from "../../utils/mock_linear_server.ts"

// Common Deno args for permissions
const denoArgs = [
  "--allow-env=GITHUB_*,GH_*,LINEAR_*,NODE_ENV,EDITOR,SNAPSHOT_TEST_NAME",
  "--allow-read",
  "--allow-write",
  "--allow-run",
  "--allow-net",
  "--quiet",
]

// Test help output
await snapshotTest({
  name: "Issue Comment Command - Help Text",
  meta: import.meta,
  colors: false,
  args: ["--help"],
  denoArgs,
  async fn() {
    await commentCommand.parse()
  },
})

// Test with explicit issue ID flag
await snapshotTest({
  name: "Issue Comment Command - With Issue Flag",
  meta: import.meta,
  colors: false,
  args: ["--issue", "TEST-123", "This is a test comment."],
  denoArgs,
  async fn() {
    const server = new MockLinearServer([
      {
        queryName: "CommentCreate",
        variables: {
          issueId: "TEST-123",
          body: "This is a test comment.",
        },
        response: {
          data: {
            commentCreate: {
              success: true,
              comment: {
                id: "comment-123",
              },
            },
          },
        },
      },
    ])

    try {
      await server.start()
      Deno.env.set("LINEAR_GRAPHQL_ENDPOINT", server.getEndpoint())
      Deno.env.set("LINEAR_API_KEY", "Bearer test-token")

      await commentCommand.parse()
    } finally {
      await server.stop()
      Deno.env.delete("LINEAR_GRAPHQL_ENDPOINT")
      Deno.env.delete("LINEAR_API_KEY")
    }
  },
})

// Test with short flag
await snapshotTest({
  name: "Issue Comment Command - With Short Flag",
  meta: import.meta,
  colors: false,
  args: ["-i", "PROJ-456", "Another comment with short flag."],
  denoArgs,
  async fn() {
    const server = new MockLinearServer([
      {
        queryName: "CommentCreate",
        variables: {
          issueId: "PROJ-456",
          body: "Another comment with short flag.",
        },
        response: {
          data: {
            commentCreate: {
              success: true,
              comment: {
                id: "comment-456",
              },
            },
          },
        },
      },
    ])

    try {
      await server.start()
      Deno.env.set("LINEAR_GRAPHQL_ENDPOINT", server.getEndpoint())
      Deno.env.set("LINEAR_API_KEY", "Bearer test-token")

      await commentCommand.parse()
    } finally {
      await server.stop()
      Deno.env.delete("LINEAR_GRAPHQL_ENDPOINT")
      Deno.env.delete("LINEAR_API_KEY")
    }
  },
})

// Test comment failure
await snapshotTest({
  name: "Issue Comment Command - Comment Creation Failed",
  meta: import.meta,
  colors: false,
  args: ["--issue", "TEST-999", "This comment will fail."],
  denoArgs,
  async fn() {
    const server = new MockLinearServer([
      {
        queryName: "CommentCreate",
        variables: {
          issueId: "TEST-999",
          body: "This comment will fail.",
        },
        response: {
          data: {
            commentCreate: {
              success: false,
              comment: null,
            },
          },
        },
      },
    ])

    try {
      await server.start()
      Deno.env.set("LINEAR_GRAPHQL_ENDPOINT", server.getEndpoint())
      Deno.env.set("LINEAR_API_KEY", "Bearer test-token")

      try {
        await commentCommand.parse()
      } catch (_error) {
        // Expected to exit with error
      }
    } finally {
      await server.stop()
      Deno.env.delete("LINEAR_GRAPHQL_ENDPOINT")
      Deno.env.delete("LINEAR_API_KEY")
    }
  },
})
