import { GatsbyNode, PluginOptions } from 'gatsby';
export interface TsOptions extends PluginOptions {
    documentPaths?: string[];
    fileName?: string;
    codegen?: boolean;
    codegenDelay?: number;
}
export declare const onPostBootstrap: GatsbyNode["onPostBootstrap"];
