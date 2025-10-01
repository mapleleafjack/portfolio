import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import AnimatedRoutes from '../components/AnimatedRoutes/AnimatedRoutes';
import './index.css';

const IndexPage = () => {
  return (
    <Router>
      <Layout>
        <AnimatedRoutes />
      </Layout>
    </Router>
  );
};

export default IndexPage;
