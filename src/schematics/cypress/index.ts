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
            addCypressCucumberBuilder(),
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

function addCypressCucumberBuilder(): Rule {
    return (tree: Tree, context: SchematicContext) => {
        const workspace = getWorkspace(tree);
        const projectName = Object.keys(workspace['projects'])[0];
        const projectArchitectJson = workspace['projects'][projectName]['architect'];

        const cypressOpenJson = {
            builder: 'ngx-devkit-cypress-builder:cypress',
            options: {
                devServerTarget: `${projectName}:serve`,
                mode: 'browser',
                configFile: normalize(
                    `${workspace['projects'][projectName]['root']}./e2e/cypress.json`
                )
            },
            configurations: {
                production: {
                    devServerTarget: `${projectName}:serve:production`
                }
            }
        };

        projectArchitectJson['e2e'] = cypressOpenJson as any;

        tree.overwrite(
            normalize(`${workspace['projects'][projectName]['root']}/angular.json`),
            JSON.stringify(workspace, null, 2)
        );

        // add "cypress-cucumber-preprocessor": {
        //     "step_definitions": "./e2e/support/step_definitions"
        // }, on package.json
        // and modify default e2e script adding e2e and e2e:ci tasks

        return tree;
    };
}