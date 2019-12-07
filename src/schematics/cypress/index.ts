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
    FileEntry,
} from '@angular-devkit/schematics';
import { getWorkspace } from '@schematics/angular/utility/config';
import { normalize } from '@angular-devkit/core';

export default function (options: any): Rule {
    return (tree: Tree, context: SchematicContext) => {
        return chain([
            removeProtractorFiles(),
            addCypressCucumberBoilerplate(),
        ])(tree, context);
    };
}

function removeProtractorFiles(): Rule {
    return (tree: Tree, context: SchematicContext) => {
        const workspace = getWorkspace(tree);
        const projectName = Object.keys(workspace['projects'])[0];

        context.logger.debug('Clean protractor files if exists');

        const targetFolder = normalize(
            `${workspace['projects'][projectName]['root']}/e2e`
        );

        tree.getDir(targetFolder).visit(file => {
            tree.delete(file);
        });
        return tree;
    };
}

function addCypressCucumberBoilerplate(): Rule {
    return (tree: Tree, context: SchematicContext) => {
        const workspace = getWorkspace(tree);
        const projectName = Object.keys(workspace['projects'])[0];
        const sourceFolder = './files';
        const targetFolder = normalize(
            `${workspace['projects'][projectName]['root']}/e2e`
        );

        context.logger.debug('Adding Cypress and Cucumber files');

        const rules = [
            move(targetFolder),
            //  fix for https://github.com/angular/angular-cli/issues/11337
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
