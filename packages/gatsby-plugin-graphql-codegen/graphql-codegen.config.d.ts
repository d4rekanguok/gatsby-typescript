import { Reporter } from 'gatsby';
import { GraphQLSchema } from 'graphql';
interface IInitialConfig {
    documentPaths: string[];
    directory: string;
    fileName: string;
    reporter: Reporter;
}
declare type GenerateFromSchema = (schema: GraphQLSchema) => Promise<void>;
declare type GenerateWithConfig = (initalOptions: IInitialConfig) => Promise<GenerateFromSchema>;
export declare const generateWithConfig: GenerateWithConfig;
export {};
