import styled from "styled-components";

const Heading = styled.h4`
    text-transform: uppercase;
    text-decoration: underline;
    text-align: center;
    color: ${({ color }) => color || "white"};
`;

export default Heading;
