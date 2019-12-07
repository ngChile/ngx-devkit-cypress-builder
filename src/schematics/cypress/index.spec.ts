import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';

jest.useFakeTimers();

describe('my-component', () => {
    const collectionPath = path.join(__dirname, '../collection.json');
    const schematicRunner = new SchematicTestRunner(
        'schematics',
        path.join(__dirname, './../collection.json'),
    );
    const projectName = 'angular-app';
    const workspaceOptions: any = {
        name: 'workspace',
        newProjectRoot: '',
        version: '0.5.0',
    };
    const appOptions: any = {
        name: projectName
    };
    let appTree: UnitTestTree;

    beforeEach(async () => {
        appTree = await schematicRunner.runExternalSchematicAsync('@schematics/angular', 'workspace', workspaceOptions).toPromise();
        appTree = await schematicRunner.runExternalSchematicAsync('@schematics/angular', 'application', appOptions, appTree).toPromise();
    });

    it('works', async () => {
        const runner = new SchematicTestRunner('schematics', collectionPath);
        const tree = await runner.runSchematicAsync('ng-add', {}, appTree).toPromise();

        const e2eFiles = tree.files.filter(fileName => fileName.includes('e2e/'))
        expect(e2eFiles).toEqual([
            `/${projectName}/e2e/tsconfig.json`,
            `/${projectName}/e2e/features/home.feature`,
            `/${projectName}/e2e/plugins/index.js`,
            `/${projectName}/e2e/plugins/webpack.config.js`,
            `/${projectName}/e2e/step_definitions/home_steps.ts`
        ]);
    });
});
