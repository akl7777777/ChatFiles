import type {NextApiRequest, NextApiResponse} from 'next'
import {getExistingVectorStore} from "@/utils/vector";
import {getModel} from "@/utils/openai";
import {loadQAStuffChain} from "langchain/chains";
import { getKeyConfiguration } from '@/utils/app/configuration';

export const config = {
    api: {
        bodyParser: false,
    }
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    console.log("beginning handler");
    // 设置允许跨域访问的域名，可以使用通配符 * 允许所有域名访问
    res.setHeader('Access-Control-Allow-Origin', '*');

    // 设置允许的请求方法
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

    // 设置允许的请求头
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    const keyConfiguration = getKeyConfiguration(req);

    const message: string = req.query.message as string;
    const indexName: string = req.query.indexName as string;

    console.log("handler chatfile query: ", message, indexName);
    const vectorStore = await getExistingVectorStore(keyConfiguration, indexName);

    const documents = await vectorStore.similaritySearch(message, 2);
    const llm = await getModel(keyConfiguration, res);
    const stuffChain = loadQAStuffChain(llm);

    try {
        stuffChain.call({
            input_documents: documents,
            question: message,
        }).catch(console.error);
        // res.status(200).json({ responseMessage: chainValues.text.toString() });
    } catch (e) {
        console.log("error in handler: ", e);
        res.status(500).json({ errorMessage: (e as Error).toString() });
    }

}

export default handler;
