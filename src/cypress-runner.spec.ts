import { Architect, BuilderContext } from '@angular-devkit/architect';
import { scheduleTargetAndForget, targetFromTargetString } from '@angular-devkit/architect/src/api';
import { TestingArchitectHost } from '@angular-devkit/architect/testing/';
import { schema, logging } from '@angular-devkit/core';
import { normalize } from 'path';
import { of } from 'rxjs';
import { CypressBuilderOptions } from './cypress-runner';

const cypress = require('cypress');

jest.mock('cypress', () => ({
    run: jest.fn(),
    open: jest.fn(),
}));

describe('Ngx Devkit Cypress Builder', () => {
    let architect: Architect;
    let architectHost: TestingArchitectHost;
    
    beforeEach(async () => {
        const registry = new schema.CoreSchemaRegistry();
        registry.addPostTransform(schema.transforms.addUndefinedDefaults);
    
        // Arguments to TestingArchitectHost are workspace and current directories.
        // Since we don't use those, both are the same in this case.
        architectHost = new TestingArchitectHost();
        architect = new Architect(architectHost, registry);
    
        // This will either take a Node package name, or a path to the directory
        // for the package.json file.
        const packageJsonPath = normalize(`${__dirname}/..`);
        await architectHost.addBuilderFromPackage(packageJsonPath);
    });

    it('should use cypress run in console mode', async () => {
        // Configure mocks, stubs and options
        const cypressOptions: CypressBuilderOptions = { 
            mode: 'console'
        };
        const testsResult = { totalFailed: 0 };
        cypress.run.mockImplementation(() => Promise.resolve(testsResult));
        (scheduleTargetAndForget as any) = jest
            .fn()
            .mockReturnValue(
                of({ success: true })
            );
        (targetFromTargetString as any) = jest
            .fn()
            .mockReturnValue(null);
        
        // Execute the builder and wait for results
        const run = await architect.scheduleBuilder(
            'ngx-devkit-cypress-builder:cypress', 
            cypressOptions,
        );
        const output = await run.result;
        await run.stop();

        // Expectations
        expect(output.success).toBe(true);
        // expect(targetFromTargetString).toHaveBeenCalledWith(stubbyOptions.devServerTarget);
        // expect(stubbyStartMock).toHaveBeenCalledWith({
        //     ...stubbyOptions,
        //     quiet: false,
        //     watch: stubbyOptions.stubsConfigFile,
        //     location: 'localhost',
        //     data: stubbyConfigAsObject,
        // }, expect.any(Function));
    });
});
