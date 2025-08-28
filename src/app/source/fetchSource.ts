"use server";

import { getPool } from "@/app/db";

type Sentence = {
  text: string;
};

type SourceData = {
  name: string;
  year_string: string;
  bibliography: string;
  attributions: string;
  sentences: Sentence[];
  count: number;
};

export async function fetchSource(
  bookName: string,
  numberInSource: number,
  excludeChinese: boolean,
  pageSize: number,
): Promise<
  { status: "success"; data: SourceData } | { status: "error"; msg: string }
> {
  if (isNaN(pageSize) || pageSize > 200) {
    return {
      status: "error",
      msg: "Invalid view_count",
    };
  }

  const start = Math.floor(numberInSource / pageSize) * pageSize;
  const end = start + pageSize;
  console.log(
    `source doc=${bookName} page=${start}-${end} ${typeof excludeChinese}`,
  );

  const excludeChineseString = excludeChinese ? "AND lang NOT IN ('chi')" : "";

  try {
    const pool = await getPool();
    const [book, sentences] = await Promise.all([
      pool.query(`SELECT * FROM books WHERE filename = $1`, [bookName]),
      pool.query(
        `
      SELECT * FROM sentences
        WHERE
          filename = $1
          ${excludeChineseString}
        ORDER BY number_in_book ASC
        OFFSET $2
        limit $3
    `,
        [bookName, start, pageSize],
      ),
    ]);
    console.log("Successfully retrieved source");

    if (book.rows.length === 0 || sentences.rows.length === 0) {
      return {
        status: "error",
        msg: "No results found",
      };
    } else {
      const curBook = book.rows[0];
      const data = {
        name: curBook.filename,
        year_string: curBook.year_string,
        bibliography: curBook.bibliography,
        attributions: curBook.attributions,
        sentences: sentences.rows,
        count: excludeChinese
          ? curBook.non_chinese_sentence_count
          : curBook.num_sentences,
      };
      return {
        status: "success",
        data: data,
      };
    }
  } catch (err) {
    console.log("Error retrieving source:", err);
    return {
      status: "error",
      msg: "Database query failed",
    };
  }
}
