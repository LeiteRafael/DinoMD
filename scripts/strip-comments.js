const babel = require('@babel/core')
const fs = require('fs')

const files = process.argv.slice(2)

for (const file of files) {
    const code = fs.readFileSync(file, 'utf8')
    const result = babel.transformSync(code, {
        filename: file,
        plugins: [
            function stripComments() {
                return {
                    visitor: {
                        Program: {
                            enter(path) {
                                path.traverse({
                                    enter(nodePath) {
                                        delete nodePath.node.leadingComments
                                        delete nodePath.node.trailingComments
                                        delete nodePath.node.innerComments
                                    },
                                })
                            },
                        },
                    },
                }
            },
        ],
        parserOpts: {
            sourceType: 'module',
            plugins: ['jsx'],
        },
        generatorOpts: { comments: false },
        presets: [],
        babelrc: false,
        configFile: false,
    })
    if (result && result.code) {
        fs.writeFileSync(file, result.code + '\n')
    }
}
