import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import {getFileContent} from '@/utils/file'
import Table from '@/components/table'
import Toolbar from "@/components/table/toolbar";
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';

import styles from './index.module.less';

export default function TablePage(){

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
        <ConfigProvider locale={zhCN}>
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