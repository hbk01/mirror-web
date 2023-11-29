import React, { useEffect, useState } from "react";
import { Layout, Menu, Breadcrumb, Divider, Row, Col, Spin } from "antd";
import { Link, useLocation, useHistory } from "react-router-dom";
import docMenu from "./menu.json";
import "./docPage.css";

const { SubMenu } = Menu;
const { Header, Content, Sider } = Layout;

/**
 * 帮助文档页面组件
 */
export default function DocPage() {
  // 帮助文档正文内容
  const [currentDocContent, setCurrentDocContent] = useState(undefined);
  // 帮助文档的路径
  const [activeDocPath, setActiveDocPath] = useState("/doc/docHome");
  // 是否已经获取了文档
  const [docLoaded, setDocLoaded] = useState(false);

  const { pathname } = useLocation();
  const history = useHistory();

  /**
   * 动态导入文档并修改页面正文内容
   *
   * @param path 文档路由
   */
  async function importAndExecDoc(path) {
    setDocLoaded(false);
    setCurrentDocContent(undefined);
    setActiveDocPath(path);

    try {
      const module = await import("./doc/js/" + path.split("/")[2] + ".js");
      setDocLoaded(true);
      setCurrentDocContent(module.default());
    } catch {
      console.log("import " + path + " failed");
      setDocLoaded(true);
      setCurrentDocContent(<h1>No Document Here!</h1>);
    }
  }

  useEffect(() => {
    let normalizedPath = pathname;
    if (/^\/doc\/?$/.test(pathname)) {
      normalizedPath = "/doc/docHome";
      history.replace("/doc/docHome");
      return;
    }

    importAndExecDoc(normalizedPath);
  }, [pathname]);

  return (
    <Row className="doc-frame">
      <Col flex={1} />
      <Col flex={22}>
        <Content className="doc-content">
          <Layout>
            <Sider breakpoint="md" collapsedWidth="0">
              <Menu
                mode="inline"
                openKeys={[activeDocPath]}
                selectedKeys={[activeDocPath]}
                style={{ height: "100%" }}
              >
                {generateMenuItems(docMenu)}
              </Menu>
            </Sider>
            <Layout
              style={{
                overflowX: "hidden"
              }}
            >
              <Header
                style={{
                  padding: "12px 48px",
                  background: "white",
                  height: "auto"
                }}
              >
                <LinkedBreadcrumb />
                <Divider style={{ marginBottom: "0" }} />
              </Header>
              <Content
                style={{
                  padding: "12px 48px 48px",
                  background: "white"
                }}
              >
                {docLoaded ? (
                  currentDocContent
                ) : (
                  <div style={{ textAlign: "center", margin: "50px" }}>
                    <Spin size="large" />
                  </div>
                )}
              </Content>
            </Layout>
          </Layout>
        </Content>
      </Col>
      <Col flex={1} />
    </Row>
  );
}

/**
 * 根据json文件递归生成文档导航菜单项目
 *
 * @param source 文档导航菜单json文件
 */
function generateMenuItems(source) {
  source.sort((a, b) => {
    if ("key" in a && "key" in b) {
      return a.key - b.key;
    } else if ("key" in a) {
      return -1;
    } else if ("key" in b) {
      return 1;
    } else {
      return a.title < b.title ? -1 : 1;
    }
  });
  return source.map(menu => {
    menu.path = `/doc/${menu.name}`;
    if (menu.children) {
      return (
        <SubMenu key={menu.path} title={menu.title}>
          {generateMenuItems(menu.children)}
        </SubMenu>
      );
    } else {
      return (
        <Menu.Item key={menu.path}>
          <Link to={menu.path}>{menu.title}</Link>
        </Menu.Item>
      );
    }
  });
}

/**
 * 可导航的面包屑组件
 */
class LinkedBreadcrumb extends React.Component {
  /**
   * 路由路径和面包屑标题的对应关系
   */
  breadcrumbNameMap = {
    "/home": "主页",
    "/doc": "帮助文档"
  };

  /**
   * 根据json文件递归生成面包屑导航项目
   *
   * @param source 文档导航菜单json文件
   */
  generateBreadcrumbNameMap(source) {
    for (let index in source) {
      if (source.hasOwnProperty(index)) {
        this.breadcrumbNameMap[source[index].path] = source[index].title;
        if (source[index].children) {
          this.generateBreadcrumbNameMap(source[index].children);
        }
      }
    }
  }

  componentDidMount() {
    this.generateBreadcrumbNameMap(docMenu);
  }

  /**
   * 面包屑导航组件
   */
  Component = () => {
    const location = useLocation();
    const pathSnippets = location.pathname.split("/").filter(i => i);
    const extraBreadcrumbItems = pathSnippets.map((_, index) => {
      const url = `/${pathSnippets.slice(0, index + 1).join("/")}`;
      return (
        <Breadcrumb.Item key={url}>
          {this.breadcrumbNameMap[url]}
        </Breadcrumb.Item>
      );
    });
    const breadcrumbItems = [
      <Breadcrumb.Item key="home">
        <Link to="/home">主页</Link>
      </Breadcrumb.Item>
    ].concat(extraBreadcrumbItems);
    return (
      <Breadcrumb style={{ margin: "20px" }}>{breadcrumbItems}</Breadcrumb>
    );
  };

  render() {
    return <this.Component />;
  }
}
