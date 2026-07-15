/**
 * Buffer Integration for Omega Swarm
 * Posts content to Instagram via Buffer's GraphQL API
 */

const BUFFER_API_URL = "https://api.buffer.com/graphql";
const BUFFER_TOKEN = process.env.BUFFER_API_KEY;

// Simple GraphQL fetch helper
async function bufferGraphQL(query, variables = {}) {
  if (!BUFFER_TOKEN) {
    return { error: "Buffer API key not configured" };
  }
  try {
    const res = await fetch(BUFFER_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${BUFFER_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
    });
    return await res.json();
  } catch (e) {
    return { error: e.message };
  }
}

// Get connected channels (Instagram, YouTube, etc.)
export async function getBufferChannels() {
  const result = await bufferGraphQL(`
    query {
      account {
        id name email
        organizations { id name }
      }
    }
  `);
  
  if (result.error || result.errors) {
    return { error: result.error || "Failed to fetch account" };
  }

  const orgId = result.data?.account?.organizations?.[0]?.id;
  if (!orgId) return { error: "No organization found" };

  const channelsResult = await bufferGraphQL(`
    query {
      channels(input: { organizationId: "${orgId}" }) {
        id name service
      }
    }
  `);

  return {
    account: result.data.account,
    channels: channelsResult.data?.channels || [],
  };
}

// Create a post via Buffer
export async function createBufferPost(channelId, text, mode = "shareNow") {
  const result = await bufferGraphQL(`
    mutation {
      createPost(input: {
        channelId: "${channelId}"
        text: "${text.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"
        mode: ${mode}
        schedulingType: automatic
      }) {
        __typename
      }
    }
  `);

  if (result.error) return { error: result.error };
  if (result.errors) return { error: result.errors[0]?.message };
  
  const typename = result.data?.createPost?.__typename;
  if (typename === "UnexpectedError") {
    return { 
      error: "Buffer posting failed. Try the Copy & Post option below.",
      fallback: true,
      text,
    };
  }
  
  return { success: true, typename };
}

// Create an idea (saves to Buffer for later)
export async function createBufferIdea(title, text) {
  const account = await bufferGraphQL(`
    query { account { organizations { id } } }
  `);
  const orgId = account.data?.account?.organizations?.[0]?.id;
  if (!orgId) return { error: "No organization" };

  const result = await bufferGraphQL(`
    mutation {
      createIdea(input: {
        organizationId: "${orgId}"
        content: { title: "${title.replace(/"/g, '\\"')}", text: "${text.replace(/"/g, '\\"').replace(/\n/g, '\\n')}" }
      }) {
        __typename
      }
    }
  `);

  if (result.error || result.errors) {
    return { error: result.error || result.errors[0]?.message };
  }
  return { success: true };
}
