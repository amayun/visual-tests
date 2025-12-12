const fs = require('fs');
const path = require('path');

module.exports = async function ({core, github, context}, {reportUrl}) {
    const filePath = path.join(process.cwd(), '.reg/out.json');

    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const {failedItems, newItems, deletedItems, passedItems} = data

    const issue_number = context.payload.pull_request.number;
    const owner = context.payload.repository.owner.login;
    const repo = context.payload.repository.name;

    const startingSymbol = `🧐`;
    const body = `${startingSymbol} Report might be found [here](${reportUrl})! \n${shortDescription({
        failedItems,
        newItems,
        deletedItems,
        passedItems
    })}`;

    const comments = await github.rest.issues.listComments({owner, repo, issue_number});

    console.log('comments.user', comments[0].user, 'app', comments[0].performed_via_github_app, 'reactions', comments[0].reactions);

    const commentsToDelete = comments.filter(({body}) => body.startsWith(startingSymbol));
    await Promise.all(commentsToDelete.map(({id: comment_id}) => github.rest.issues.deleteComment({
        owner,
        repo,
        comment_id,
    })));

    github.rest.issues.createComment({owner, repo, issue_number, body});
}

function shortDescription({failedItems, newItems, deletedItems, passedItems}) {
    const descriptions = [
        tableItem(failedItems.length, ":red_circle: Changed"),
        tableItem(newItems.length, ":white_circle: New"),
        tableItem(deletedItems.length, ":black_circle: Deleted"),
        tableItem(passedItems.length, ":large_blue_circle: Passing"),
    ];

    const filteredDescriptions = descriptions.filter((item) => item != null);
    const headerColumns = filteredDescriptions.map(([_, header]) => header);
    const headerDelimiter = filteredDescriptions.map(() => " --- ");
    const itemCount = filteredDescriptions.map(([itemCount]) => itemCount);

    return [
        `| ${headerColumns.join(" | ")} |`,
        `| ${headerDelimiter.join(" | ")} |`,
        `| ${itemCount.join(" | ")} |`,
    ].join("\n");
}

function tableItem(itemCount, header) {
    return itemCount === 0 ? null : [itemCount, header];
}
