# 安裝說明 / Installing

試行版的安裝檔沒有購買 Apple／Microsoft 的程式碼簽章憑證，所以 Windows 和 macOS 都會先擋一次。這是正常的，照下面做即可。

## Windows

1. 下載 `CBAM-Auto-Filler-x.y.z-setup.exe`。
2. 雙擊安裝，出現藍色視窗「Windows 已保護您的電腦」時：
   - 點 **其他資訊**
   - 再點 **仍要執行**
3. 選安裝位置，完成。程式會裝在你的使用者帳號下，不需要系統管理員權限。

## macOS

先看你的 Mac 是哪一種：左上角  → **關於這台 Mac**，看「晶片 / 處理器」。

- 寫 **Apple M1／M2／M3…** → 下載 `CBAM-Auto-Filler-x.y.z-arm64.dmg`
- 寫 **Intel** → 下載 `CBAM-Auto-Filler-x.y.z-x64.dmg`

步驟：

1. 打開 dmg，把程式拖到「應用程式」。
2. 第一次打開會出現「無法打開，因為無法驗證開發者」：
   - 打開 **系統設定 → 隱私權與安全性**
   - 捲到底，點 **強制打開**
3. 之後就能正常開啟。

### 如果看到「已損毀，你應該將其移到垃圾桶」

這不是檔案壞掉，是 macOS 對「從網路下載、又沒有 Apple 付費憑證」的程式的說法。**v0.1.1 的 dmg 會出現這個訊息，請改下載 v0.1.2 以後的版本。**

手上已經是舊版、不想重載的話，打開「終端機」執行一行，再開一次程式：

```bash
xattr -cr "/Applications/CBAM Auto-Filler.app"
```

還是擋的話，再補一行重新簽一次（本機簽，不需要任何憑證）：

```bash
codesign --force --deep --sign - "/Applications/CBAM Auto-Filler.app"
```

## 資料存在哪裡

- 你填的資料**只存在自己的電腦**，不會上傳。
- 程式會自動暫存目前進度，關掉再打開會接續。
- 要保留或交給同事，用工具列的 **儲存專案** 存成 `.cbam` 檔。

## 解除安裝

- Windows：設定 → 應用程式 → CBAM Auto-Filler → 解除安裝。
- macOS：把「應用程式」裡的程式丟到垃圾桶。
