const fs = require("fs");
const path = require("path");
const axios = require("axios");
const sleep = require('sleep');
axios.defaults.timeout = 5000; //设置超时时间
//匹配文件内路径的正则
const fileLinkReg = /(https|http).*\.(jpg|png|gif|jpeg|webp)/g;
// 匹配图片的名称正则
const fileNameReg = /.*(\/|\\)(.+)$/;
/**
 * 
 * @param {Sting} filePath 文件路径
 * @param {Array|null} linkArray 存储文件内链接的数组,可传可不传
 * @returns 
 */
function getFileLink(filePath, linkArray = []) {
    //获取文件内数据
    let fileData = fs.readFileSync(filePath).toString();
     //获取所有的图片url地址
    linkArray = fileData.match(fileLinkReg);

    return linkArray;
}

/**
 * 获取所有的md文件列表
 * @param {String} dir 目录
 * @param {Array} filesList 暂存读取的文件列表
 * @returns {Array} filesList md文件列表
 */
function readAllFileList(dir, filesList = []) {
    const files = fs.readdirSync(dir);
    files.forEach((item, index) => {
        var fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        //如果是路径
        if (stat.isDirectory()) {
            readAllFileList(path.join(dir, item), filesList); //递归读取文件
        } else {
            if (/.md$/.test(fullPath)) {
                filesList.push(fullPath);
            }
        }
    });
    return filesList;
}

/**
 * 获取当前文件内的所有链接
 * @param {Array} allFilePath 要遍历的文件数组路径
 * @param {*} linkArray 
 */
function getAllFileLink(allFilePath, linkArray = []) {
    //依次读取文件获取文件的目录
    let temp = allFilePath.shift();
    while (temp) {
        //获取当前文件内的所有链接
        linkArray.push(getFileLink(temp));
        temp = allFilePath.shift();
    }
    return linkArray;
}
/**
 * 实现图片保存到当前对应md文件下的 assets 目录
 * @param {*} picLink 图片链接
 * @param {*} filePath 存放的位置
 */
async function completeDown(picLink, filePath) {
    //获取图片的名称
    let [, , picFileName] = fileNameReg.exec(picLink);
    // 访问图片地址
    try {
        //对图片链接进行编码,防止中文导致访问不了
        picLink = encodeURI(picLink);
        let response = await axios.get(picLink, {
            responseType: 'stream'
        });
        var temp = path.resolve(filePath, picFileName);
        //生成C:\Users\Administrator\Desktop\get\file\测试md.assets\XVsG0e.jpg
        response.data.pipe(fs.createWriteStream(temp));
        console.log("写入文件成功 ---图片链接地址【" + picLink + "】");
        sleep.msleep(300);
        return Promise.resolve(picFileName);
    } catch (error) {
        console.log("写入失败!!!---访问超时--图片链接地址【" + picLink + "】");
        // console.log(error);
        // return Promise.reject(error);//带错误下面去处理
        // return new Promise(()=>{});//不处理错误
        sleep.msleep(300);
        return Promise.resolve(null); //防止访问错误中断程序,这里用resolve,不然直接报错导致程序中断
    }

}

module.exports = {
    readAllFileList,
    getAllFileLink,
    completeDown
}