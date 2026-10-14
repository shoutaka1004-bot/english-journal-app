// journals.journal_date に合わせた "YYYY-MM-DD" 形式で、日本時間の今日を返す。
// サーバーはUTCで動くことがあるため、new Date() をそのまま日付にすると朝9時前に前日になる。
export function todayInTokyo(): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
  }).format(new Date());
}
