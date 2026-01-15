// Global Search Fulltext Index
// This index enables full-text search across Mystery, Location, TimePeriod, and Category nodes.
//
// IMPORTANT: Run this query once to create the index before using the search API.
// The index will automatically update when nodes are created, updated, or deleted.
//
// Usage:
//   1. Connect to your Neo4j database (via Neo4j Browser, cypher-shell, or any client)
//   2. Run the CREATE INDEX query below
//   3. Verify the index was created with the SHOW INDEXES query
//
// Note: Index creation may take a few minutes on large databases.

// Create the fulltext index
CREATE FULLTEXT INDEX globalSearch IF NOT EXISTS
FOR (n:Mystery|Location|TimePeriod|Category)
ON EACH [n.title, n.name, n.label];

// Verify the index was created
// SHOW INDEXES WHERE name = 'globalSearch';

// Example search query (for testing):
// CALL db.index.fulltext.queryNodes("globalSearch", "bermuda")
// YIELD node, score
// RETURN node.id AS id,
//        labels(node)[0] AS type,
//        coalesce(node.title, node.name, node.label) AS text,
//        score
// ORDER BY score DESC
// LIMIT 10;
