import React from 'react';
import Layout from '../components/Layout/Layout';
import AnimatedRoutes from '../components/AnimatedRoutes/AnimatedRoutes';
import './index.css';

const IndexPage = ({ location }) => {
  return (
    <Layout>
      <AnimatedRoutes location={location} />
    </Layout>
  );
};

export default IndexPage;
