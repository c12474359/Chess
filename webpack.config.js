const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractText = require('extract-text-webpack-plugin')

module.exports={
    entry:{
        app:'./public/src/index.js'
    },
    output:{
        path:__dirname+'/public/dist',
        filename:'[name].js'
    },
    module:{
        rules:[
            {
                test:/\.js$/,
                include:/public/,
                use:[
                    {
                        loader:'babel-loader',
                        options:{
                            presets:[['@babel/preset-env'],
                        ['@babel/preset-flow']]
                        }
                    }
                ]
            },
            {
                test:/\.scss$/,
                include:/public/,
                use:ExtractText.extract({
                    use:[{
                        loader:"css-loader"
                    },{
                        loader:"sass-loader"
                    }]
                })
            }
        ]
    },
    plugins:[
        new HtmlWebpackPlugin({
            template:'./public/index.html',
            filename:'./index.html',
            scriptLoading:'defer'
        }),
        new ExtractText({
            filename:'[name].css'
        })
    ],
    devServer:{
        host:'127.0.0.1',
        port:4000,
        contentBase:'./public/dist',
        hot:true
    }
}