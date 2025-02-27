import { useEffect, useRef } from "react"
import { BaseDirectory,  readTextFile, writeFile } from '@tauri-apps/plugin-fs';
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useTranslation } from "react-i18next";

import styles from './index.module.less'


// 默认配置
export const defaultConfig = {
  appearance: "light",
  language: "zhCN",
  autoUpdate: "auto",
}

// 配置文件路径
const CONFIG_FILE = "config.json"

export default function SettingsForm() {
  const form = useRef<HTMLFormElement>(null)
  const {t} = useTranslation()

  // 加载配置
  useEffect(() => {
    async function loadConfig() {
      try {
        // 尝试读取配置文件
        const configText = await readTextFile(CONFIG_FILE, { baseDir: BaseDirectory.AppConfig }).catch(() =>
          JSON.stringify(defaultConfig),
        )
        // 解析配置
        const loadedConfig = JSON.parse(configText)
        // form.reset(loadedConfig)
        if (form.current) {
          Object.entries(loadedConfig).forEach(([key, value]) => {
            const element = form.current?.elements.namedItem(key) as HTMLSelectElement;
            if (element) {
              element.value = value as string;
            }
          });
        }
      } catch (error) {
      }
    }

    loadConfig()
  }, [])

  const closeWindow = async () => {
    const currentWindow = await WebviewWindow.getByLabel('settings-window')
    currentWindow?.close?.();
  }

  // 保存配置
  const saveConfig = async () => {
    const formData = new FormData(form.current!)
    const values: Record<string, string> = {}
    formData.forEach((value, key) => {
      values[key] = value as string
    })
    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(JSON.stringify(values, null, 2));
      await writeFile(CONFIG_FILE, data, { baseDir: BaseDirectory.AppConfig })

      const windows = await WebviewWindow.getAll();
      for (const window of windows) {
        if (window.label !== 'settings-window') {
          console.log('emit', 'eeees')
          // 发送消息到其他窗口通知配置已更改
          await window.emit('lang-changed', values);
        }
      }
      closeWindow();
    } catch (error) {
      console.error("保存配置失败:", error)
    }

  }

  return (
    <div className={styles.ctn}>
              <div className={styles.header}>
          <div className={styles.type}>{t('general')}</div>
        </div>
      <div className={styles.content}>

      <form ref={form}>
        <div className={styles.block}>
        <div className={styles.formitem}>
          <label>{t('appearance')}:</label>
          <select name="appearance">
            {/* <option value="system">跟随系统</option> */}
            <option value="light">{t('light')}</option>
            {/* <option value="dark">深色</option> */}
          </select>
        </div>
        <div className={styles.formitem}>
          <label>{t('display language')}:</label>
          <select name="language">
            <option value="zhCN">简体中文</option>
            <option value="enUS">English</option>
          </select>
        </div>
        {/* <div className={styles.formitem}>
          <label>样式:</label>
          <select name="style">
            <option value="default">默认</option>
            <option value="compact">紧凑</option>
          </select>
        </div> */}
        {/* <div className={styles.formitem}>
          <label>CJK 字体</label>
          <select name="cjkFont">
            <option value="default">默认</option>
            <option value="Noto Sans CJK SC">Noto Sans CJK SC</option>
          </select>
        </div> */}
        <div className={styles.formitem}>
          <label>{t('automatic update')}</label>
          <select name="autoUpdate">
            <option value="auto">{t('auto update')}</option>
            <option value="notify">{t('notify update')}</option>
            <option value="manual">{t('manual update')}</option>
          </select>
        </div>
        {/* <div className={styles.formitem}>
          <label>拼写检查</label>
          <input type="checkbox" name="spellCheck" />
        </div>
        <div className={styles.formitem}>
          <label>分享分析</label>
          <input type="checkbox" name="shareAnalytics" />
        </div> */}
        </div>
      </form>
      </div>
      <div className={styles.footer}>
        <button onClick={saveConfig}>{t('apply')}</button>
        <button onClick={closeWindow}>{t('cancel')}</button>
      </div>
    </div>
  )
}

