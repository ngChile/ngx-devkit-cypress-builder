import {
    Rule,
    SchematicContext,
    Tree,
    apply,
    chain,
    mergeWith,
    move,
    url,
    forEach,
    FileEntry
} from "@angular-devkit/schematics";

export default function (_options: any): Rule {
    return (tree: Tree, _context: SchematicContext) => {
        return chain([
            removeProtractorFiles(),
            addCypressCucumberBoilerplate(),
        ])(tree, _context);
    };
}

function removeProtractorFiles(): Rule {
    return (tree: Tree, context: SchematicContext) => {
        context.logger.debug("Clean protractor files");
        tree.delete("./e2e");
        return tree;
    };
}

function addCypressCucumberBoilerplate(): Rule {
    return (tree: Tree, context: SchematicContext) => {
        const sourceFolder = './files';
        const targetFolder = './e2e';

        context.logger.debug('Adding Cypress and Cucumber files');

        const rules = [
            move(targetFolder),
            // fix for https://github.com/angular/angular-cli/issues/11337
            forEach((fileEntry: FileEntry) => {
                if (tree.exists(fileEntry.path)) {
                  tree.overwrite(fileEntry.path, fileEntry.content);
                }
                return fileEntry;
            }),
        ];
        const sourceUrl = url(sourceFolder);
        const rule = chain([
            mergeWith(apply(sourceUrl, rules))
        ]);
        return rule(tree, context);
    }
}
