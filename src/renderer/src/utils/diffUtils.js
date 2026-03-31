const findShortestEdit = (baseline, current) => {
    const baseLen = baseline.length
    const curLen = current.length
    const maxMoves = baseLen + curLen

    const bestX = new Array(2 * maxMoves + 1).fill(0)
    bestX[maxMoves + 1] = 0

    const trace = []

    for (let depth = 0; depth <= maxMoves; depth++) {
        trace.push(bestX.slice())

        for (let diagonal = -depth; diagonal <= depth; diagonal += 2) {
            const idx = diagonal + maxMoves

            const shouldMoveDown =
                diagonal === -depth || (diagonal !== depth && bestX[idx - 1] < bestX[idx + 1])

            let x = shouldMoveDown ? bestX[idx + 1] : bestX[idx - 1] + 1
            let y = x - diagonal

            while (x < baseLen && y < curLen && baseline[x] === current[y]) {
                x++
                y++
            }

            bestX[idx] = x

            if (x >= baseLen && y >= curLen) {
                return trace
            }
        }
    }

    return trace
}

const backtrackEditScript = (trace, baseline, current) => {
    const baseLen = baseline.length
    const curLen = current.length
    const maxMoves = baseLen + curLen
    const operations = []

    let x = baseLen
    let y = curLen

    for (let depth = trace.length - 1; depth >= 0; depth--) {
        const savedBestX = trace[depth]
        const diagonal = x - y

        const shouldHaveMovedDown =
            diagonal === -depth ||
            (diagonal !== depth &&
                savedBestX[diagonal - 1 + maxMoves] < savedBestX[diagonal + 1 + maxMoves])

        const prevDiagonal = shouldHaveMovedDown ? diagonal + 1 : diagonal - 1
        const prevX = savedBestX[prevDiagonal + maxMoves]
        const prevY = prevX - prevDiagonal

        while (x > prevX && y > prevY) {
            x--
            y--
        }

        if (depth > 0) {
            if (shouldHaveMovedDown) {
                operations.unshift({ type: 'insert', baselineIdx: x, currentIdx: prevY })
            } else {
                operations.unshift({ type: 'delete', baselineIdx: prevX, currentIdx: y })
            }

            x = prevX
            y = prevY
        }
    }

    return operations
}

const isRelatedContent = (oldLine, newLine) => {
    if (oldLine.length === 0 || newLine.length === 0) return false

    const shorter = oldLine.length <= newLine.length ? oldLine : newLine
    const longer = oldLine.length > newLine.length ? oldLine : newLine

    if (longer.includes(shorter)) return true

    const lengthRatio = shorter.length / longer.length

    if (lengthRatio > 0.8) return false

    return true
}

const buildChangeMap = (operations, baseline, current) => {
    const changeMap = new Map()
    let currentLineOffset = 0

    for (let i = 0; i < operations.length; i++) {
        const operation = operations[i]

        if (operation.type === 'delete') {
            const nextOperation = operations[i + 1]
            const isFollowedByInsert = nextOperation && nextOperation.type === 'insert'

            if (isFollowedByInsert) {
                const deletedLine = baseline[operation.baselineIdx]
                const insertedLine = current[nextOperation.currentIdx]
                const insertedLineNumber = nextOperation.currentIdx + 1

                if (isRelatedContent(deletedLine, insertedLine)) {
                    changeMap.set(insertedLineNumber, 'modified')
                } else {
                    changeMap.set(insertedLineNumber, 'added')
                }
                i++
                currentLineOffset--
            } else {
                const deletedAtLine = operation.baselineIdx + 1 + currentLineOffset
                changeMap.set(deletedAtLine, 'deleted')
                currentLineOffset--
            }
        } else if (operation.type === 'insert') {
            const insertedLineNumber = operation.currentIdx + 1
            changeMap.set(insertedLineNumber, 'added')
        }
    }

    return changeMap
}

const computeLineDiff = (baselineLines, currentLines) => {
    if (baselineLines.length === 0) {
        const changeMap = new Map()
        currentLines.forEach((_, idx) => changeMap.set(idx + 1, 'added'))
        return changeMap
    }

    if (currentLines.length === 0) {
        const changeMap = new Map()
        baselineLines.forEach((_, idx) => changeMap.set(idx + 1, 'deleted'))
        return changeMap
    }

    const trace = findShortestEdit(baselineLines, currentLines)
    const operations = backtrackEditScript(trace, baselineLines, currentLines)

    return buildChangeMap(operations, baselineLines, currentLines)
}

export { computeLineDiff }
