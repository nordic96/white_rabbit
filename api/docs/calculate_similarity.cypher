
// Step 1 Category-based Similarity
MATCH (m1:Mystery)-[:HAS_CATEGORY]->(c:Category)<-[:HAS_CATEGORY]-(m2:Mystery)
WHERE id(m1) < id(m2)
WITH m1, m2, count(c) AS shared_categories
WHERE shared_categories > 0
MERGE (m1)-[r:SIMILAR_TO]->(m2)
SET r.category_score = shared_categories * 0.4,
    r.reasons = ['shared category']
MERGE (m2)-[:SIMILAR_TO]->(m1);

// Step 2 Time overlap similarity
MATCH (m1:Mystery)-[:OCCURRED_IN]->(t1:TimePeriod),
      (m2:Mystery)-[:OCCURRED_IN]->(t2:TimePeriod)
WHERE id(m1) < id(m2)
  AND t1.start_year <= t2.end_year
  AND t2.start_year <= t1.end_year
MERGE (m1)-[r:SIMILAR_TO]->(m2)
SET r.time_score = 0.3,
    r.reasons = coalesce(r.reasons, []) + 'overlapping time period'
MERGE (m2)-[:SIMILAR_TO]->(m1);

// Step 3 Location based Similarity
MATCH (m1:Mystery)-[:LOCATED_AT]->(l:Location)<-[:LOCATED_AT]-(m2:Mystery)
WHERE id(m1) < id(m2)
MERGE (m1)-[r:SIMILAR_TO]->(m2)
SET r.location_score = 0.3,
    r.reasons = coalesce(r.reasons, []) + 'shared location'
MERGE (m2)-[:SIMILAR_TO]->(m1);


// Step 4 Compute Final Similarity Score
MATCH (m1:Mystery)-[r:SIMILAR_TO]->(m2:Mystery)
SET r.score =
    coalesce(r.category_score, 0) +
    coalesce(r.time_score, 0) +
    coalesce(r.location_score, 0);

// Step 5 Prune Weak Links
MATCH ()-[r:SIMILAR_TO]->()
WHERE r.score < 0.3
DELETE r;
