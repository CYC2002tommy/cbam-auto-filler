# 取得 Gemini API 金鑰 / Getting a Gemini API key

AI 讀單據和「問 AI」需要一把 Gemini API 金鑰。金鑰免費申請，用你自己的 Google 帳號即可，約 3 分鐘。程式裡也有同樣的教學：左下角 **設定 → 怎麼取得金鑰？**

## 步驟

1. 打開 [Google AI Studio](https://aistudio.google.com/apikey)，用 Google 帳號登入。建議用公司的帳號，不要用私人帳號。
2. 第一次使用會請你同意服務條款。同意後 Google 會自動建立一個專案和一把金鑰；沒看到金鑰就按 **Create API key**。
3. 按金鑰旁的複製按鈕，複製整串金鑰。
4. 回到 CBAM 申報助手：左下角 **設定 → 自己的 Gemini 金鑰** → 貼上 → **套用**。看到「金鑰已套用」就完成了。金鑰會加密存在這台電腦。
5. 金鑰跟密碼一樣，不要寄給別人、不要貼到群組。外流了就到 AI Studio 刪掉，再建一把新的。

## 免費和付費有什麼差別

| | 免費金鑰 | 付費金鑰（專案已開通 Cloud Billing） |
|---|---|---|
| 費用 | 不用綁信用卡 | 依用量計費，價格以 Google 公告為準 |
| 次數 | 每分鐘、每天有上限 | 上限較高 |
| 送出的內容 | Google 的條款允許用來改進產品，也可能由人工審閱 | 不會用來改進產品，只為防止濫用保留一段時間 |

## 為什麼不能用 Google 或 Claude 帳號登入

Google 和 Anthropic 都不允許第三方程式借用 Gemini 或 Claude 的「訂閱方案」登入來呼叫 AI（2026 年起已有使用者因此被 Google 停權），所以本程式只支援 API 金鑰。

## 這個程式會送出什麼

只有你按下 AI 功能時才會送出：讀單據時送出你拖進來的那份檔案；問 AI 時只送出你的問題和那一格的說明，**不送你填的數字**。其他資料都只存在你的電腦。

---

**English, in short.** Open [Google AI Studio](https://aistudio.google.com/apikey), sign in, accept the terms (a project and a key are created for you; otherwise press **Create API key**), copy the key, and paste it under **Settings → Your own Gemini key → Apply** in the app. With a free key Google may use what you send to improve its products; once Cloud Billing is enabled for the key's project it does not. Subscription sign-in (Gemini or Claude) is not offered because both providers forbid third-party apps from using it.

依據 / Sources: Google AI for Developers, [Using Gemini API keys](https://ai.google.dev/gemini-api/docs/api-key) and [Gemini API Additional Terms of Service](https://ai.google.dev/gemini-api/terms); Anthropic, [Agent SDK overview](https://code.claude.com/docs/en/agent-sdk/overview). Checked 2026-10-03.
