#!/usr/bin/env python3
"""Read-only export of Consensus v0.8 paper test; no network or credentials."""
import argparse
import datetime as dt
import json
import sqlite3
from pathlib import Path

def export(db):
    uri=Path(db).resolve().as_uri()+"?mode=ro"
    with sqlite3.connect(uri,uri=True) as con:
        con.row_factory=sqlite3.Row
        rows=con.execute("""SELECT p.match_id,p.market,p.outcome,p.home,p.away,p.kickoff,p.observed,p.probability,p.odds,r.home_goals,r.away_goals
            FROM ai_paper_v1 p LEFT JOIN ai_paper_results_v1 r ON r.match_id=p.match_id
            WHERE p.market IN ('1X2','OU25') ORDER BY p.kickoff,p.match_id,p.market""").fetchall()
    return {"schema":"betinsight-consensus-paper-v1","exported_at":dt.datetime.now(dt.timezone.utc).isoformat(),"rows":[dict(r) for r in rows]}

if __name__=="__main__":
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--db",default="/var/lib/betinsight-consensus/consensus-intern.sqlite3")
    args=p.parse_args()
    print(json.dumps(export(args.db),ensure_ascii=False,allow_nan=False))
