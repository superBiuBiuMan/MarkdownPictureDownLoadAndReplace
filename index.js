const fs = require("fs");
const path = require("path");
const {
    readAllFileList,
    getAllFileLink,
    completeDown
} = require("./utils/index");
const readline = require('readline');
//用户输入使用
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
// 匹配文件的名称和后缀用到的正则
const fileNameReg = /(.*)(\/|\\)(.+)$/;

var allFilePathArray;
var allFileLinkArray;
rl.question('请输入你的文件夹路径', (answer) => {
    if (answer) {
        //获取当前目录下所有的md文件的绝对路径
        allFilePathArray = readAllFileList(answer);
        // console.log(allFilePathArray);

        // 获取当前目录下所有的md文件的链接,
        allFileLinkArray = getAllFileLink([...allFilePathArray]); //注意这里应该是浅拷贝
        // console.log(allFileLinkArray);
        test();

    }

    // rl.close();
});

// 用async实习代码等待
async function test() {
    var linkArray; //当前文件对应的图片数组链接
    var abPath = allFilePathArray.shift(); //获取对应的绝对路径; 
    linkArray = allFileLinkArray.shift();
    // 当前文件有图片链接才进入读取
    if (linkArray) {
        // abPath = allFilePathArray.shift(); //获取对应的绝对路径
        console.log("------文件【  " + abPath + "  】开始处理------\n");
        //获取md的文件名称
        let [, , , mdFileName] = fileNameReg.exec(abPath);
        //获取 保存图片文件夹的路径
        //C:\Users\Administrator\Desktop\get\file\测试md.md => C:\Users\Administrator\Desktop\get\file\测试md.assets
        let pathf = abPath.substring(0, abPath.length - 3) + ".assets";
        //获取  保存图片文件夹的名称
        //C:\Users\Administrator\Desktop\get\file\测试md.assets => C:\Users\Administrator\Desktop\get\file 和 测试md.assets
        let [, dirPath, , newFileName] = fileNameReg.exec(pathf);
        // console.log("mdFileName",mdFileName);
        // console.log("dirPath",dirPath);
        // console.log("newFileName",newFileName);
        // console.log("pathf",pathf);
        // 建立文件夹
        try {
            fs.openSync(pathf);
        } catch (error) {
            fs.mkdirSync(pathf);
        }
        //读取当前文件数据
        var fileData = fs.readFileSync(abPath).toString();
        //开始写入数据 返回图片名称
        let link = linkArray.pop();
        while (link) {
            let picName = await completeDown(link, pathf);
            if (picName) {
                // 替换文件内容 并且使用正则全局替换,这样子全部相同的被替换
                // https://s1.ax1x.com/2022/05/26/XVsG0e.jpg => 测试md.assets/XVsG0e.jpg
                fileData = fileData.replace(new RegExp(link, "g"), newFileName + "/" + picName);
            }
            //接着下一个图片链接
            link = linkArray.pop();
        }
        //写入文件
        try {
            fs.writeFileSync(path.resolve(dirPath, mdFileName), fileData);
            console.log("------文件【  " + mdFileName + "  】处理完毕!------\n");
            test();
        } catch (error) {
            console.log("------文件【  " + mdFileName + "  】处理发生异常!------\n", error);
        }
    } else if (allFileLinkArray.length > 0) {
        test();
    } else {
        console.log("*************程序全部处理完成,请查看是否有因图床问题导致的保存失败!*************");
    }
}