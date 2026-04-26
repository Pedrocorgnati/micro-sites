import * as React from 'react';

export interface StructuredDataProps {
  schema: Record<string, unknown> | Array<Record<string, unknown>>;
  id: string;
}

export function StructuredData({ schema, id }: StructuredDataProps) {
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default StructuredData;
