FROM python:3.10-slim
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PIP_ROOT_USER_ACTION ignore

# The app should be run as a non-root user but any volumes
# will be mounted as root or, at least, not mounted by `app`.
RUN addgroup --system app && adduser --system --group app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY --chown=app:app entrypoint.sh /app/
COPY --chown=app:app schema.sql /app/
COPY --chown=app:app app.py /app/
COPY --chown=app:app screen_server/ /app/screen_server
COPY --chown=app:app static/ /app/static
COPY --chown=app:app templates/ /app/templates

RUN mkdir /data && chown app:app /data

ENTRYPOINT ["/app/entrypoint.sh"]
