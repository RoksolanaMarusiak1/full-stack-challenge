export type Link = {
  code: string;
  url: string;
  clicks: number;
  createdAt: Date;
};

export type NewLink = Pick<Link, "code" | "url">;
