""" screen/ server shared utilities. """
import base64
import secrets
import time

def make_id() -> str:
  """ Create a UUID-style string from 8 bytes of timestamp + random bytes.
  The first 4 bytes are random and the last 4 are seconds since epoch. The
  random 4 bytes should add enough entropy to prevent any collisions if
  this is called more than once per second and also prevent guessing of the ID.
  The 8 bytes are (lowercase) base32 encoded to create 13 characters (after
  removing the padding).
  """
  # We're using the "GUID" as the primary key in the database. Primary keys
  # might be a bit faster, and would also prevent the risk of page-fill issues
  # in a sql database, but that doesn't afford randomness, so we'd need to
  # store PK in one column and "other bits" in another column, or a complicated
  # set of functions to convert between sequential IDs and our IDs (by swapping
  # the bytes, converting to and form ints, and base32, etc, and re-converting
  # the ID when it comes out of the database (or storing the string version
  # as well), etc, etc).
  byts = secrets.token_bytes(4) + int(time.time()).to_bytes(4, byteorder='big')
  return base64.b32encode(byts).decode('ascii').replace('=', '').lower()
