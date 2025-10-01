
import Layout from '../components/Layout/Layout';
import AnimatedRoutes from '../components/AnimatedRoutes/AnimatedRoutes';
import './index.css';


import React, { useState } from 'react';

const IndexPage = ({ location }) => {
  // Modal state lifted here
  const [modalOpen, setModalOpen] = useState(false);
  const [modalProject, setModalProject] = useState(null);

  const handleCardClick = (project) => {
    setModalProject(project);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setModalProject(null);
  };

  return (
    <Layout>
      <AnimatedRoutes
        location={location}
        modalOpen={modalOpen}
        modalProject={modalProject}
        handleCardClick={handleCardClick}
        handleModalClose={handleModalClose}
      />
    </Layout>
  );
};

export default IndexPage;
