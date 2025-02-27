import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import {getFileContent} from '@/utils/file'
import Table from '@/components/table'
import Toolbar from "@/components/table/toolbar";
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import enUS from "antd/es/calendar/locale/en_US";

import styles from './index.module.less';
import { useTranslation } from "react-i18next";

export default function TablePage(){

    const {i18n} = useTranslation();
    const currentLanguage = i18n.language; // 获取当前语言

    const locale = currentLanguage === 'enUS' ? enUS : zhCN;

    const [params] = useSearchParams();
    const path = params.get('file')
    const [data, setData] = useState()
    const filename = path?.split?.('\\')?.pop()

    async function getTableJson(p:string){
        const json = await getFileContent(p)
        setData(JSON.parse(json))
    }
    
    useEffect(()=>{
        if(path){
            getTableJson(path)
        }
    }, [path])


    return (
        <ConfigProvider locale={locale}>
            <div className={styles.ctn}>
                <div className={styles.toolbar}>
                    <Toolbar />
                </div>
                <div className={styles.tableCtn}>
                    <Table fileData={data} filename={filename} filePath={path} />
                </div>
            </div>
        </ConfigProvider>
    )
}