const fs = require('fs');
const path = require('path');

module.exports = function({github}) {
    const filePath = path.join(process.cwd(), '.reg/out.json');

    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const {failedItems, newItems, deletedItems, passedItems} = data

    const body = `👋 Thanks for **reporting**! \n
          ${shortDescription({failedItems, newItems, deletedItems, passedItems})}`;

    github.rest.issues.createComment({
        issue_number: context.payload.pull_request.number,
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        body
    });
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
