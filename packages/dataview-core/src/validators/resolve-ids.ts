interface IdentifiableProperty {
  id?: string;
  key?: string;
  name?: string;
}

/**
 * Resolve each property's id the way DataViewProvider does (id → key →
 * name → index), so validators accept raw property definitions that only
 * set `key`.
 */
export function resolvePropertyIds<P extends IdentifiableProperty>(
  properties: readonly P[]
): P[] {
  return properties.map((property, index) =>
    property.id
      ? property
      : { ...property, id: property.key ?? property.name ?? String(index) }
  );
}
