import {
    Rule,
    SchematicContext,
    Tree,
    apply,
    chain,
    mergeWith,
    move,
    url,
    MergeStrategy,
} from '@angular-devkit/schematics';
import { getWorkspace } from '@schematics/angular/utility/config';
import { join, normalize } from 'path';

export default function (options: any): Rule {
    return (tree: Tree, context: SchematicContext) => {
        return chain([
            removeProtractorFiles(),
            addCypressCucumberBoilerplate(),
            addCypressBuilder(),
            addCypressCucumberCosmiconfig(),
        ])(tree, context);
    };
}

function removeProtractorFiles(): Rule {
    return (tree: Tree, context: SchematicContext) => {
        const workspace = getWorkspace(tree);
        const projectName = Object.keys(workspace['projects'])[0];

        context.logger.debug('Clean protractor files if exists');

        const targetFolder = join(
            normalize(workspace['projects'][projectName]['root']),
            '/e2e'
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
        const targetFolder = join(
            normalize(workspace['projects'][projectName]['root']),
            '/e2e'
        );

        context.logger.debug('Adding Cypress and Cucumber files');

        const rules = [
            move(targetFolder),
        ];
        const sourceUrl = url(sourceFolder);
        const rule = chain([
            mergeWith(apply(sourceUrl, rules), MergeStrategy.Overwrite)
        ]);
        return rule(tree, context);
    }
}

function addCypressBuilder(): Rule {
    return (tree: Tree, context: SchematicContext) => {
        const workspace = getWorkspace(tree);
        const projectName = Object.keys(workspace['projects'])[0];
        const projectArchitectJson = workspace['projects'][projectName]['architect'];
        const configFile = join(
            normalize(workspace['projects'][projectName]['root']),
            'e2e/cypress.json'
        );
        const cypressOpenJson = {
            builder: 'ngx-devkit-cypress-builder:cypress',
            options: {
                devServerTarget: `${projectName}:serve`,
                mode: 'browser',
                configFile
            },
            configurations: {
                production: {
                    devServerTarget: `${projectName}:serve:production`
                }
            }
        };

        projectArchitectJson['e2e'] = cypressOpenJson as any;

        tree.overwrite(
            './angular.json',
            JSON.stringify(workspace, null, 2)
        );
        return tree;
    };
}

function addCypressCucumberCosmiconfig(): Rule {
    return (tree: Tree, context: SchematicContext) => {
        const packageJson = JSON.parse(
            tree.read('./package.json').toString('utf-8')
        );
        packageJson['cypress-cucumber-preprocessor'] = {
            'step_definitions': './e2e/step_definitions'
        };
        packageJson['scripts']['e2e:ci'] = 'ng e2e --mode console';

        tree.overwrite(
            './package.json',
            JSON.stringify(packageJson, null, 2)
        );
        return tree
    };
}
