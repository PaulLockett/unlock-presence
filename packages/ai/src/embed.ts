// Embedding generation — uses OpenAI-compatible API via OpenRouter
// OpenRouter doesn't expose textEmbeddingModel directly,
// so embeddings call the REST API until a proper embedding provider is added.

export async function generateEmbedding(_text: string): Promise<number[]> {
  // Stub: will be implemented with direct OpenAI embedding API or
  // when OpenRouter adds embedding model support to the AI SDK provider
  throw new Error("Not implemented: generateEmbedding — requires embedding provider setup");
}

export async function generateEmbeddings(_texts: string[]): Promise<number[][]> {
  throw new Error("Not implemented: generateEmbeddings — requires embedding provider setup");
}
