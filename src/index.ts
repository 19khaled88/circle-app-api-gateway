import 'dotenv/config';
import {ApolloServer} from '@apollo/server';
import {startStandaloneServer} from '@apollo/server/standalone';

import { ApolloGateway,IntrospectAndCompose,RemoteGraphQLDataSource, type GraphQLDataSourceProcessOptions } from '@apollo/gateway';


class AuthenticateDataSource extends RemoteGraphQLDataSource{
    willSendRequest({request,context}:any) {
        if(context.authorization){
            request.http.headers.set('Authorization',context.authorization);
        }
    }
}
async function start(){

    const gateway = new ApolloGateway({
        supergraphSdl:new IntrospectAndCompose({
            subgraphs:[
                {name:'auth', url:process.env.AUTH_SERVICE_URL!},
                // {name:'circles', url:process.env.CIRCLE_SERVICE_URL} 
            ],
        }),
        buildService({ url }){
            if(!url){
                throw new Error('Missing subgraphq url in gateway config')
            }
            return new AuthenticateDataSource({ url });
        },
    });


    const server = new ApolloServer({gateway});

    const {url} = await startStandaloneServer(server,{
        context:async({req})=>{
            return {authorization:req.headers.authorization || ''};
        },
        listen:{port:Number(process.env.PORT) || 4000},  
    });

    console.log(`api-gateway ready at ${url}`);

}
start().catch((err)=>{
    console.log('Failed to start api-gateway:',err);
    process.exit(1)
});