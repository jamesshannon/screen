#!/bin/bash

if [ -f "$FLASK_DB_FILE" ]
then
	echo "SQLite database found at $FLASK_DB_FILE."
else
  echo "SQLite database not found at $FLASK_DB_FILE. Creating and initializing."
  python -m flask initdb
fi

exec "$@"
