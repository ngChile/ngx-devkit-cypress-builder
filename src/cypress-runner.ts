import { JsonObject } from '@angular-devkit/core';
import { createBuilder } from '@angular-devkit/architect/src/create-builder';
import { scheduleTargetAndForget, targetFromTargetString } from '@angular-devkit/architect/src/api';
import { BuilderContext, BuilderOutput } from '@angular-devkit/architect';
import { Observable, of, noop, Subscriber } from 'rxjs';
import { fromPromise } from 'rxjs/internal-compatibility';
import { concatMap, map, take, tap, catchError } from 'rxjs/operators';

const cypress = require("cypress");

export enum CypressRunningMode {
    Console = "console",
    Browser = "browser"
}

export interface CypressBuilderOptions extends JsonObject {
    devServerTarget?: string;
    mode?: string;
    baseUrl?: string;
    host?: string;
    ciBuildId?: string;
    // env?: object;
    group?: string;
    key?: string;
    parallel?: boolean;
    port?: number;
    project?: string;
    record?: boolean;
    reporter?: string;
    reporterPath?: string;
    spec?: string;
}

export default createBuilder<CypressBuilderOptions>(run);

function run(
    options: CypressBuilderOptions,
    context: BuilderContext
): Observable<BuilderOutput> {
    return of(null)
        .pipe(
            concatMap(() => startDevServer(options.devServerTarget, true, context)),
            concatMap(() => executeCypress(options, context)),
            options.mode === CypressRunningMode.Console? take(1) : tap(noop),
            catchError(error => {
              context.reportStatus(`Error: ${error.message}`);
              context.logger.error(error.message);
              return of({
                success: false
              });
            })
        );
}

function startDevServer(
    devServerTarget: string,
    isWatching: boolean,
    context: BuilderContext
  ): Observable<BuilderOutput> {
    // Overrides dev server watch setting.
    const overrides = {
      watch: isWatching
    };
    return scheduleTargetAndForget(
      context,
      targetFromTargetString(devServerTarget),
      overrides
    );
}

function executeCypress(
    options: CypressBuilderOptions,
    context: BuilderContext
): Observable<BuilderOutput> {
    const additionalCypressConfig = {
        config: {
          baseUrl: options.baseUrl
        },
        ...(options.ciBuildId ? { ciBuildId: options.ciBuildId } : {}),
        ...(options.env ? { env: options.env } : {}),
        ...(options.group ? { group: options.group } : {}),
        ...(options.key ? { key: options.key } : {}),
        ...(options.parallel ? { parallel: options.parallel } : {}),
        ...(options.project ? { project: options.project } : {}),
        ...(options.record ? { record: options.record } : {}),
        ...(options.reporter ? { reporter: options.reporter } : {}),
        ...(options.reporterPath ? { reporter: options.reporterPath } : {}),
        ...(options.spec ? { spec: options.spec } : {})
    };
    return fromPromise<any>(
        options.mode === CypressRunningMode.Console ? cypress.run(additionalCypressConfig) : cypress.open(additionalCypressConfig)
      ).pipe(
        map(result => ({
          /**
           * `cypress.open` is returning `0` and is not of the same type as `cypress.run`.
           * `cypress.open` is the graphical UI, so it will be obvious to know what wasn't
           * working. Forcing the build to success when `cypress.open` is used.
           */
          success: result.hasOwnProperty(`totalFailed`)
            ? result.totalFailed === 0
            : true
        }))
      );
}

