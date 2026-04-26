# last-refresh.json (TASK-4 ST003)

Registry de timestamp do ultimo refresh bem-sucedido por site.

Formato:
```json
{
  "d01-calculadora-custo-site": "2026-04-22T12:00:00Z",
  "a01": "2026-03-15T09:30:00Z"
}
```

Atualizado apos execucao bem-sucedida de `/blog:refresh-content` ou refresh manual.
Consumido pelo dashboard (TASK-9) e pelo workflow `content-freshness.yml`.
