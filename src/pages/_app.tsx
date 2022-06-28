import "regenerator-runtime/runtime";
import "../styles/globals.css";
import type { AppContext, AppProps } from "next/app";
import App from "next/app";

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

MyApp.getInitialProps = async (appContext: AppContext) => {
  const appProps = await App.getInitialProps(appContext);

  if (appContext.ctx.res?.statusCode === 404) {
    appContext.ctx.res.writeHead(302, { Location: "/" });
    appContext.ctx.res.end();
    return;
  }

  return { ...appProps };
};

export default MyApp;
