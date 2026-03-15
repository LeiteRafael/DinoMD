module.exports = {
    meta: {
        type: 'suggestion',
        docs: { description: 'Disallow all comments' },
        schema: [],
        messages: { noComments: 'Comments are not allowed.' },
    },
    create(context) {
        return {
            Program() {
                const comments = context.getSourceCode().getAllComments()
                for (const comment of comments) {
                    context.report({ node: comment, messageId: 'noComments' })
                }
            },
        }
    },
}
