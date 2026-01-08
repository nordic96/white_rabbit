MATCH (loc:Location {id: "l-central-europe"}),
      (tp:TimePeriod {id: "tp-middle-ages"}),
      (cat:Category {id: "c-ancient-text"})
CREATE (m:Mystery {
  id: "m-" + randomUUID(),
  title: "Voynich Manuscript",
  status: "unresolved",
  first_reported_year: 1404,
  last_reported_year: 1410,
  confidence_score: 0.9
})
CREATE (m)-[:LOCATED_AT]->(loc)
CREATE (m)-[:OCCURRED_IN]->(tp)
CREATE (m)-[:HAS_CATEGORY]->(cat);

MATCH (loc:Location {id: "l-central-europe"}),
      (tp:TimePeriod {id: "tp-middle-ages"}),
      (cat:Category {id: "c-ancient-text"})
CREATE (m:Mystery {
  id: "m-" + randomUUID(),
  title: "Codex Gigas",
  status: "partially_resolved",
  first_reported_year: 1200,
  last_reported_year: 1220,
  confidence_score: 0.7
})
CREATE (m)-[:LOCATED_AT]->(loc)
CREATE (m)-[:OCCURRED_IN]->(tp)
CREATE (m)-[:HAS_CATEGORY]->(cat);

MATCH (loc:Location {id: "l-mediterranean"}),
      (tp:TimePeriod {id: "tp-bronze-collapse"}),
      (cat:Category {id: "c-ancient-civilization"})
CREATE (m:Mystery {
  id: "m-" + randomUUID(),
  title: "Sea Peoples",
  status: "unresolved",
  first_reported_year: -1300,
  last_reported_year: -1100,
  confidence_score: 0.8
})
CREATE (m)-[:LOCATED_AT]->(loc)
CREATE (m)-[:OCCURRED_IN]->(tp)
CREATE (m)-[:HAS_CATEGORY]->(cat);

MATCH (loc:Location {id: "l-constantinople"}),
      (tp:TimePeriod {id: "tp-middle-ages"}),
      (cat:Category {id: "c-military-tech"})
CREATE (m:Mystery {
  id: "m-" + randomUUID(),
  title: "Greek Fire",
  status: "partially_resolved",
  first_reported_year: 672,
  last_reported_year: 1200,
  confidence_score: 0.6
})
CREATE (m)-[:LOCATED_AT]->(loc)
CREATE (m)-[:OCCURRED_IN]->(tp)
CREATE (m)-[:HAS_CATEGORY]->(cat);

MATCH (loc:Location {id: "l-alexandria"}),
      (tp:TimePeriod {id: "tp-hellenistic"}),
      (cat:Category {id: "c-destruction"})
CREATE (m:Mystery {
  id: "m-" + randomUUID(),
  title: "Library of Alexandria",
  status: "unresolved",
  first_reported_year: -300,
  last_reported_year: -48,
  confidence_score: 0.85
})
CREATE (m)-[:LOCATED_AT]->(loc)
CREATE (m)-[:OCCURRED_IN]->(tp)
CREATE (m)-[:HAS_CATEGORY]->(cat);
