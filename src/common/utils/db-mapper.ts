/**
 * Recursively scans database response objects and maps `id` to `_id`.
 * This preserves compatibility with mobile frontends expecting MongoDB-like _id properties.
 */
export function mapDbResponse<T>(data: T): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => mapDbResponse(item));
  }

  if (data instanceof Date) {
    return data;
  }

  if (Buffer.isBuffer(data)) {
    return data;
  }

  if (typeof data === 'object') {
    const mapped: any = {};
    for (const key of Object.keys(data)) {
      if (key === 'password' || key === '__v') {
        continue;
      }
      const val = (data as any)[key];
      if (key === 'id') {
        mapped._id = val;
        mapped.id = val;
      } else {
        mapped[key] = mapDbResponse(val);
      }
    }

    if (mapped.id !== undefined && mapped._id === undefined) {
      mapped._id = mapped.id;
    }
    if (mapped._id !== undefined && mapped.id === undefined) {
      mapped.id = mapped._id;
    }

    return mapped;
  }

  return data;
}
