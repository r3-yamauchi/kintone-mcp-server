// src/server/tools/documentation/calcField.js

/**
 * 計算フィールドのドキュメントを取得する関数
 * @returns {string} ドキュメント文字列
 */
export function getCalcFieldDocumentation() {
    return `
# 計算フィールド（CALC）の仕様

## 概要
他のフィールドの値を使用して計算を行うフィールドです。数値計算だけでなく、文字列操作や条件分岐なども可能です。合計金額の計算、税額計算、割引計算、日付計算、条件付き表示など、様々な自動計算処理を実現できます。

## 主要なプロパティ
1. \`expression\`: 計算式（文字列、必須）
   - 他のフィールドを参照して計算を行う式を指定します
   - フィールドコード、演算子、関数を組み合わせて記述します
2. \`format\`: 表示形式（省略可）
   - 計算結果の表示形式を指定します
   - 以下の値が指定可能です：
     - "NUMBER"：数値（例：1000）
     - "NUMBER_DIGIT"：数値（桁区切りあり）（例：1,000）
     - "DATE"：日付（例：2012-08-06）
     - "TIME"：時刻（例：2:03）
     - "DATETIME"：日時（例：2012-08-06 2:03）
     - "HOUR_MINUTE"：時間（例：26時間3分）
     - "DAY_HOUR_MINUTE"：時間（例：1日2時間3分）
   - 省略時は "NUMBER_DIGIT"（桁区切りあり）になります
   - **重要**: 計算フィールドで桁区切り表示を有効にするには、\`format\`に"NUMBER_DIGIT"を指定する必要があります
3. \`displayScale\`: 小数点以下の桁数（"0"～"10"、省略可、format="NUMBER"または"NUMBER_DIGIT"の場合のみ有効）
   - 小数点以下の表示桁数を指定します（例："2"で小数点以下2桁まで表示）
   - 文字列型の数値で指定します
4. \`unit\`: 単位（省略可、format="NUMBER"または"NUMBER_DIGIT"の場合のみ有効）
   - 数値の単位を指定します（例："円"、"%"、"kg"など）
5. \`unitPosition\`: 単位の位置（"BEFORE"/"AFTER"、省略時は"AFTER"、format="NUMBER"または"NUMBER_DIGIT"の場合のみ有効）
   - "BEFORE"：単位を数値の前に表示（例：$100）
   - "AFTER"：単位を数値の後に表示（例：100円）

## 計算フィールドの特徴

- 他のフィールドの値を参照して自動的に計算します
- 読み取り専用で、ユーザーが直接値を入力することはできません
- 参照先のフィールド値が変更されると、自動的に再計算されます
- 数値計算、文字列操作、条件分岐、日付計算など様々な計算が可能です
- テーブル内のデータを集計することもできます
- 表示形式を数値、日付、時刻、日時から選択できます

## 使用例

### 基本的な計算フィールド（数値計算）
\`\`\`json
{
  "type": "CALC",
  "code": "total_amount",
  "label": "合計金額",
  "expression": "quantity * unit_price",
  "format": "NUMBER",
  "digit": true,
  "displayScale": "0",
  "unit": "円",
  "unitPosition": "AFTER"
}
\`\`\`

### 税込金額計算
\`\`\`json
{
  "type": "CALC",
  "code": "tax_included_price",
  "label": "税込価格",
  "expression": "ROUND(price * 1.1, 0)",
  "format": "NUMBER",
  "digit": true,
  "unit": "円"
}
\`\`\`

### 条件付き計算（割引価格）
\`\`\`json
{
  "type": "CALC",
  "code": "discount_price",
  "label": "割引後価格",
  "expression": "IF(quantity >= 10, price * 0.9, price)",
  "format": "NUMBER",
  "digit": true,
  "unit": "円"
}
\`\`\`

### 文字列結合（氏名）
\`\`\`json
{
  "type": "CALC",
  "code": "full_name",
  "label": "氏名",
  "expression": "last_name & \\" \\" & first_name"
}
\`\`\`

## 演算子と関数の一覧

計算式で利用できる演算子と関数を説明します。
計算する対象が数値か文字列かで、利用できる演算子と関数が異なります。

### 演算子の説明
次の演算子が使用できます。

| 演算子 | 説明 |
| --- | --- |
| + | 数値の足し算を行います。 |
| - | 数値の引き算を行います。単項演算子として、フィールドの値の正負を変換する目的にも使用できます。 |
| * | 数値の掛け算を行います。 |
| / | 数値の割り算を行います。 |
| ^ | 数値のべき算を行います。-100乗から100乗まで計算できます。べき指数に小数を指定すると、整数に切り下げて計算されます。例：3^2.5は3^2に変換され、計算結果は9になります。 |
| & | 文字列または数値を結合します。数値型または文字列型のフィールドが参照されていて未入力の場合は、空文字列とみなして結合します。 |
| = | 文字列または数値の値が等しければ真、等しくなければ偽を返します。型が異なる比較は偽になります。 |
| != | 「=」の比較結果を反転させたものになります。型が異なる比較は真になります。 |
| <> | !=と同様の結果になります。 |
| < | 左の値が右の値より小さければ真、右の値以上であれば偽を返します。 |
| <= | 左の値が右の値以下であれば真、右の値より大きければ偽を返します。 |
| > | 左の値が右の値より大きければ真、右の値以下であれば偽を返します。 |
| >= | 左の値が右の値以上であれば真、右の値より小さければ偽を返します。 |

### 演算子の優先順位

演算子の優先順位を、優先度の高い順に記載します。

* +, -（正符号および負符号の単項演算子：+1、-2など）
* ^（べき算）
* *, /（掛け算と割り算）
* +, -（足し算と引き算）
* &（文字列演算子）
* =, !=, <>, <, >, <=, >=（比較演算子）

### 関数の説明

関数は大文字と小文字のどちらでも入力できます。
次の関数が使用できます。

| 関数 | 説明 | 例 |
| --- | --- | --- |
| SUM | 数値のフィールドコード、値が数値になる計算式、または数値を合計します。 | SUM(金額) |
| YEN | 計算結果を、指定した桁数で四捨五入し、3桁ごとの桁区切りの「¥（円）」形式で表示します。 | YEN(price * 1.1) |
| DATE_FORMAT | 日時の形式やタイムゾーンを変更します。 | DATE_FORMAT(created_time, "YYYY/MM/DD") |
| IF | 条件を指定し、その条件の真偽によって異なった値を返します。 | IF(quantity > 10, price * 0.9, price) |
| AND | 計算式で指定した条件が全て真となる時は真を返し、そうでなければ偽を返します。32個までの引数を指定できます。 | AND(price > 1000, quantity > 5) |
| OR | 計算式で指定した条件のいずれかが真となる時は真を返し、そうでなければ偽を返します。32個までの引数を指定できます。 | OR(category = "A", price > 5000) |
| NOT | 条件を反転させます。 | NOT(status = "完了") |
| ROUND | 数値を四捨五入します。 | ROUND(price * 1.1, 0) |
| ROUNDDOWN | 数値を切り捨てます。 | ROUNDDOWN(price * 1.1, 0) |
| ROUNDUP | 数値を切り上げます。 | ROUNDUP(price * 1.1, 0) |
| CONTAINS | 指定したフィールドが条件（選択肢）と一致しているか、またはテーブル内に条件（検索文字列）と一致する行があるかどうかを判定します。 | CONTAINS(categories, "重要") |

## DATE_FORMAT関数の詳細

DATE_FORMAT関数は、日付や時刻の表示形式を指定して表示する関数です。

構文:
\`\`\`
DATE_FORMAT(日時, "日時の形式", "タイムゾーン")
\`\`\`

### 第1引数：日時
表示形式を指定したい日時を指定します。フィールドコード、UNIX時刻、または計算式で指定できます。

- フィールドコードで指定する場合：日時、日付、時刻、作成日時、更新日時、数値、計算フィールドが指定可能
- UNIX時刻で指定する場合：-30610224000以上、253402300799以下の範囲で指定
- 計算式で指定する場合：+, -, *, /, ^, SUM関数が使用可能

### 第2引数：日時の形式
日時の形式を指定します。例えば：
- "YYYY/MM/dd" → 2020/04/01
- "YYYY年M月d日" → 2020年4月1日
- "YYYY-MM-dd HH:mm" → 2020-04-01 13:00

指定できる形式：
- 年：YYYY（2020）
- 月：MMMM（April、4月）、MMM（Apr、4月）、MM（04）、M（4）
- 日：dd（01）、d（1）
- 時間：a（PM、午後）、KK（00-11）、K（0-11）、hh（01-12）、h（1-12）、HH（00-23）、H（0-23）、kk（01-24）、k（1-24）
- 分：mm（05）、m（5）
- 秒：ss（01）、s（1）
- タイムゾーン：Z（+0900）、ZZ（+09:00）、ZZZ（Asia/Tokyo）

### 第3引数：タイムゾーン
タイムゾーンを指定します。
- 日付/時刻フィールドを指定した場合は "Etc/GMT" を指定
- それ以外の場合は表示したいタイムゾーン（例："Asia/Tokyo"）を指定
- "system" を指定すると、システムタイムゾーンが適用されます

### 使用例
\`\`\`
DATE_FORMAT(日付, "YYYY年M月d日", "Etc/GMT")
\`\`\`
日付フィールドに "2020-04-01" を入力すると、"2020年4月1日" が表示されます。

\`\`\`
DATE_FORMAT(日時, "YYYY-MM-dd HH:mm", "America/Los_Angeles")
\`\`\`
日本時間の "2020-04-01 13:00" を太平洋標準時に変換して表示します。

## 応用例

### テーブルの集計
テーブル内の数値を合計する例：

\`\`\`json
{
  "type": "CALC",
  "code": "total_amount",
  "label": "合計金額",
  "expression": "SUM(金額)",
  "format": "NUMBER",
  "digit": true,
  "unit": "円"
}
\`\`\`

### 条件付き集計
特定の条件に合致する行のみを集計する例：

\`\`\`json
{
  "type": "CALC",
  "code": "high_priority_count",
  "label": "高優先度タスク数",
  "expression": "SUM(IF(priority = \\"high\\", 1, 0))",
  "format": "NUMBER"
}
\`\`\`

### 複合条件による価格計算
複数の条件に基づいて価格を計算する例：

\`\`\`json
{
  "type": "CALC",
  "code": "final_price",
  "label": "最終価格",
  "expression": "IF(AND(quantity > 10, customer_type = \\"premium\\"), price * 0.8, IF(quantity > 10, price * 0.9, price))",
  "format": "NUMBER",
  "digit": true,
  "unit": "円"
}
\`\`\`

### 文字列操作
文字列を結合して住所を作成する例：

\`\`\`json
{
  "type": "CALC",
  "code": "full_address",
  "label": "住所",
  "expression": "postal_code & \\" \\" & prefecture & city & street"
}
\`\`\`

### ステータス表示
条件に基づいてステータスを表示する例：

\`\`\`json
{
  "type": "CALC",
  "code": "stock_status",
  "label": "在庫状況",
  "expression": "IF(stock_quantity = 0, \\"在庫切れ\\", IF(stock_quantity < 10, \\"残りわずか\\", \\"在庫あり\\"))"
}
\`\`\`

## サブテーブル内のフィールド参照について

kintoneでは、フィールドコードは1つのアプリ内で一意である必要があります。そのため、サブテーブル内のフィールドを参照する際には、サブテーブル名を指定する必要はありません。

### 正しい参照方法
\`\`\`
SUM(金額)  // 正しい - テーブル内の「金額」フィールドを直接参照
\`\`\`

### 誤った参照方法
\`\`\`
SUM(経費明細.金額)  // 誤り - サブテーブル名は不要
\`\`\`

テーブル内のフィールドを参照する場合は、フィールドコードのみを指定します。これは、フィールドコードがアプリ内で一意であるためです。

## よくある間違いと代替方法

kintoneの計算フィールドは、Excel/Spreadsheetなどの関数と異なる部分があります。以下によくある間違いと、その代替方法を示します。

### 1. サポートされていない関数の使用

以下の関数はkintoneではサポートされていないため、代替方法を使用する必要があります：

- DAYS_BETWEEN → DATE_FORMAT関数と減算を組み合わせる
  例: ROUNDDOWN(DATE_FORMAT(終了日, "YYYY/MM/DD") - DATE_FORMAT(開始日, "YYYY/MM/DD"), 0)

- AVERAGE → SUM関数と除算を組み合わせる
  例: SUM(点数) / COUNT(点数)

- CONCATENATE → &演算子を使用する
  例: 姓 & " " & 名

- COUNTIF → SUM関数とIF関数を組み合わせる
  例: SUM(IF(状態 = "完了", 1, 0))

- SUMIF → SUM関数とIF関数を組み合わせる
  例: SUM(IF(カテゴリ = "A", 金額, 0))

- TODAY → 日付フィールドでdefaultNowValue: trueを設定

- NOW → 日時フィールドでdefaultNowValue: trueを設定

- MONTH → DATE_FORMAT関数を使用
  例: DATE_FORMAT(日付, "MM")

- YEAR → DATE_FORMAT関数を使用
  例: DATE_FORMAT(日付, "YYYY")

- DAY → DATE_FORMAT関数を使用
  例: DATE_FORMAT(日付, "DD")

### 2. サブテーブル内のフィールド参照方法

kintoneでは、フィールドコードは1つのアプリ内で一意である必要があります。そのため、サブテーブル内のフィールドを参照する際には、サブテーブル名を指定する必要はありません。

誤った参照方法:
- SUM(経費明細.金額) → 正しくは: SUM(金額)
- SUM(IF(経費明細.種別 = "交通費", 経費明細.金額, 0)) → 正しくは: SUM(IF(種別 = "交通費", 金額, 0))
- 経費明細.備考 & "の金額: " & 経費明細.金額 → 正しくは: 備考 & "の金額: " & 金額

### 3. 日付計算の誤り

日付の差分を計算する場合、DATE_FORMAT関数を使用して日付を標準形式に変換してから計算する必要があります。

誤った計算方法:
- 終了日 - 開始日 → 正しくは: DATE_FORMAT(終了日, "YYYY/MM/DD") - DATE_FORMAT(開始日, "YYYY/MM/DD")
- DAYS_BETWEEN(開始日, 終了日) → 正しくは: ROUNDDOWN(DATE_FORMAT(終了日, "YYYY/MM/DD") - DATE_FORMAT(開始日, "YYYY/MM/DD"), 0)

### 4. 条件式の複雑化

複雑な条件式は、可読性のために複数の計算フィールドに分割することをお勧めします。

例えば、以下のような複雑な条件式:
\`\`\`
IF(AND(quantity > 10, customer_type = "premium", payment_method = "credit"), price * 0.8, IF(AND(quantity > 10, customer_type = "premium"), price * 0.85, IF(quantity > 10, price * 0.9, price)))
\`\`\`

以下のように分割するとよいでしょう:
1. discount_rate = IF(AND(quantity > 10, customer_type = "premium", payment_method = "credit"), 0.8, IF(AND(quantity > 10, customer_type = "premium"), 0.85, IF(quantity > 10, 0.9, 1)))
2. final_price = price * discount_rate

## 注意事項
1. 計算フィールドは読み取り専用で、ユーザーが直接値を入力することはできません
2. 計算式で参照するフィールドは、計算フィールドを作成する前に存在している必要があります
3. 循環参照（AがBを参照し、BがAを参照するような状態）はエラーになります
4. 計算式の長さには制限があります（一般的には最大4,000文字程度）
5. 複雑な計算式は、可読性のために複数の計算フィールドに分割することをお勧めします
6. 計算フィールドの値は、参照先のフィールド値が変更されるたびに再計算されます
7. 大量のレコードや複雑な計算式を使用する場合、パフォーマンスに影響する可能性があります
8. 計算フィールドの作成は create_calc_field ツールを使用すると簡単です
9. 計算式を作成する前に、get_field_type_documentation ツールで計算フィールドの仕様を確認することをお勧めします
10. Excel/Spreadsheetなどで使用できる関数の多くはkintoneではサポートされていないため、代替方法を使用する必要があります

## 関連情報
- 計算フィールドは、他の計算フィールドを参照することもできます（循環参照に注意）
- 計算フィールドの値は、CSVエクスポート時にも出力されます
- 計算フィールドは、条件付き書式設定と組み合わせて使用すると効果的です
`;
}
