"use server";

import { getPool } from "@/app/db";

type ListData = {
  text: string;
  full_count: number;
};

export async function fetchList(
  offset: number,
  limit: number,
): Promise<
  { status: "success"; data: ListData[] } | { status: "error"; msg: string }
> {
  console.log(`source_list offset=${offset} limit=${limit}`);
  try {
    const pool = await getPool();
    const result = await pool.query(
      `
      SELECT *, count(*) OVER() AS full_count FROM books
      ORDER BY year_sort ASC, filename::bytea ASC
      OFFSET $1
      LIMIT $2
    `,
      [offset, limit],
    );
    return {
      status: "success",
      data: result.rows,
    };
  } catch (error) {
    console.error("Error fetching source list:", error);
    return {
      status: "error",
      msg: "Database query failed",
    };
  }
}
